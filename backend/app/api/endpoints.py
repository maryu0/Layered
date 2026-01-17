"""
FastAPI endpoints for the Layered Architecture Drift Detection API.
Frontend-optimized responses for graph visualization and violation management.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid
from datetime import datetime
import asyncio

from app.models.schemas import (
    AnalysisRequest, AnalysisResult, ArchitectureMap,
    ViolationSummary, ViolationDetail,
    NodeData, EdgeData, LayerDefinition
)
from app.models.database import Analysis, Violation, ArchitectureHistory
from app.db.connection import get_db
from app.analysis.analyzer import RepositoryAnalyzer
from app.graph.builder import DependencyGraph
from app.analysis.inference import ArchitectureInferenceEngine
from app.rules.engine import RulesEngine
from app.drift.detector import ViolationDetector
from app.ai.explainer import ExplanationService
from app.utils.git_helper import prepare_repository, cleanup_temp_directory, is_github_url
from app.services.history_service import HistoryService
from app.services.settings_service import settings_service
from app.models.history_schemas import (
    AnalysisSnapshotDocument, RepositoryInfo as MongoRepoInfo,
    ArchitectureSnapshot as MongoArchSnapshot, NodeSnapshot, EdgeSnapshot,
    ViolationSnapshot, ViolationSummary as MongoViolationSummary
)
from sqlalchemy import select, desc

router = APIRouter()
explanation_service = ExplanationService(use_ai=False)


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_repository(
    request: AnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze a repository and detect architecture drift.
    
    Supports both local paths and GitHub URLs:
    - Local: C:\\Projects\\my-app
    - GitHub: https://github.com/user/repo
    
    This endpoint:
    1. Analyzes code structure
    2. Infers intended architecture
    3. Detects violations
    4. Stores results in database
    """
    analysis_id = str(uuid.uuid4())
    start_time = datetime.utcnow()
    local_path = None
    is_temp = False
    
    try:
        # Step 0: Prepare repository (clone if GitHub URL) with timeout
        print(f"Preparing repository: {request.repo_path}")
        try:
            # Run in executor to avoid blocking and add timeout
            loop = asyncio.get_event_loop()
            local_path, is_temp = await asyncio.wait_for(
                loop.run_in_executor(None, prepare_repository, request.repo_path),
                timeout=300.0  # 5 minute timeout for cloning
            )
            print(f"Repository prepared: {local_path}")
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504, 
                detail="Repository cloning timed out. The repository may be too large or network is slow. Try a smaller repository or use a local path."
            )
        except Exception as clone_error:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to access repository: {str(clone_error)}"
            )
        
        # Step 1: Analyze repository
        analyzer = RepositoryAnalyzer(
            repo_path=local_path,
            include_tests=request.include_tests
        )
        modules, dependencies = analyzer.analyze()
        
        # Step 2: Build dependency graph
        graph = DependencyGraph()
        graph.build_from_analysis(modules, dependencies)
        
        # Step 3: Infer architecture
        inference_engine = ArchitectureInferenceEngine(graph)
        architecture_config = inference_engine.infer_architecture()
        
        # Step 4: Create rules and detect violations
        rules_engine = RulesEngine(architecture_config)
        detector = ViolationDetector(
            graph, 
            rules_engine, 
            architecture_config['module_assignments']
        )
        violations = detector.detect_all_violations()
        
        # Apply settings: filter by severity threshold
        settings = settings_service.get_settings()
        severity_order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
        threshold_level = severity_order[settings.analysis.severity_threshold.value]
        
        violations = [
            v for v in violations 
            if severity_order.get(v['severity'].upper(), 0) >= threshold_level
        ]
        
        # Step 5: Generate explanations for violations (if enabled)
        if settings.ai.enable_explanations:
            for violation in violations:
                explanation_data = explanation_service.explain_violation(
                    violation,
                    detail_level=settings.ai.explanation_detail.value
                )
                violation['ai_explanation'] = explanation_data['explanation']
                violation['suggested_fix'] = explanation_data['suggested_fix']
        else:
            for violation in violations:
                violation['ai_explanation'] = None
                violation['suggested_fix'] = None
        
        # Step 6: Store in database
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        violations_by_severity = detector.get_violations_by_severity()
        
        # Create analysis record
        analysis = Analysis(
            id=analysis_id,
            repo_path=request.repo_path,
            branch=request.branch,
            status='success',
            total_modules=len(modules),
            total_dependencies=len(dependencies),
            total_violations=len(violations),
            violations_by_severity=violations_by_severity,
            created_at=start_time,
            completed_at=end_time,
            duration_seconds=duration
        )
        db.add(analysis)
        
        # Create violation records
        for viol_data in violations:
            violation = Violation(
                id=viol_data['id'],
                analysis_id=analysis_id,
                type=viol_data['type'],
                severity=viol_data['severity'],
                title=viol_data['title'],
                description=viol_data['description'],
                source_module=viol_data['source_module'],
                target_module=viol_data['target_module'],
                dependency_path=viol_data['dependency_path'],
                rule_name=viol_data['rule_name'],
                pattern_broken=viol_data['pattern_broken'],
                ai_explanation=viol_data.get('ai_explanation'),
                suggested_fix=viol_data.get('suggested_fix'),
                created_at=viol_data['timestamp']
            )
            db.add(violation)
        
        # Create history snapshot
        history = ArchitectureHistory(
            id=str(uuid.uuid4()),
            analysis_id=analysis_id,
            timestamp=end_time,
            total_violations=len(violations),
            violations_by_type=detector.get_violations_by_type(),
            violations_by_severity=violations_by_severity,
            graph_snapshot=graph.to_dict()
        )
        db.add(history)
        
        await db.commit()
        
        # Step 7: Save snapshot to MongoDB for history tracking
        try:
            history_service = HistoryService()
            
            # Extract repo name from path
            repo_name = local_path.split('/')[-1] if '/' in local_path else local_path.split('\\')[-1]
            
            # Build MongoDB snapshot
            mongo_snapshot = AnalysisSnapshotDocument(
                repo=MongoRepoInfo(
                    name=repo_name,
                    branch=request.branch or "main"
                ),
                timestamp=end_time,
                architecture=MongoArchSnapshot(
                    layers=architecture_config['layers'],  # Already a list of strings
                    nodes=[
                        NodeSnapshot(
                            id=node['id'],
                            label=node.get('label', node['id']),
                            layer=node.get('layer', 'unknown'),
                            severity=node.get('severity')
                        )
                        for node in graph.to_dict()['nodes']
                    ],
                    edges=[
                        EdgeSnapshot(
                            from_node=edge['from'],
                            to_node=edge['to'],
                            violates=edge.get('is_violation', False)
                        )
                        for edge in graph.to_dict()['edges']
                    ]
                ),
                violations=[
                    ViolationSnapshot(
                        type=v['type'],
                        rule=v['rule_name'],
                        severity=v['severity'],
                        from_module=v['source_module'],
                        to_module=v['target_module'],
                        title=v['title'],
                        description=v['description']
                    )
                    for v in violations
                ],
                summary=MongoViolationSummary(
                    total=len(violations),
                    critical=violations_by_severity.get('critical', 0),
                    high=violations_by_severity.get('high', 0),
                    medium=violations_by_severity.get('medium', 0),
                    low=violations_by_severity.get('low', 0)
                )
            )
            
            print(f"Attempting to save snapshot to MongoDB...")
            snapshot_id = await history_service.save_snapshot(mongo_snapshot)
            print(f"✓ Successfully saved snapshot to MongoDB: {snapshot_id}")
        except Exception as mongo_err:
            import traceback
            print(f"✗ ERROR: Failed to save MongoDB snapshot: {mongo_err}")
            print(f"Traceback: {traceback.format_exc()}")
            # Don't fail the analysis if MongoDB save fails
        
        return AnalysisResult(
            analysis_id=analysis_id,
            status='success',
            total_modules=len(modules),
            total_dependencies=len(dependencies),
            total_violations=len(violations),
            violations_by_severity=violations_by_severity,
            timestamp=end_time,
            duration_seconds=duration
        )
        
    except Exception as e:
        # Log error and store failed analysis
        analysis = Analysis(
            id=analysis_id,
            repo_path=request.repo_path,
            branch=request.branch,
            status='failed',
            error_message=str(e),
            created_at=start_time
        )
        db.add(analysis)
        await db.commit()
        
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    finally:
        # Clean up temporary directory if it was cloned
        if is_temp and local_path:
            cleanup_temp_directory(local_path)


@router.get("/architecture-map", response_model=ArchitectureMap)
async def get_architecture_map(
    analysis_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get architecture dependency graph for visualization.
    Returns nodes, edges, layers, and highlighted violations.
    Respects settings for layer boundaries and violation highlighting.
    """
    # Get settings
    settings = settings_service.get_settings()
    
    # Get latest analysis if no ID provided
    if not analysis_id:
        result = await db.execute(
            select(Analysis)
            .where(Analysis.status == 'success')
            .order_by(desc(Analysis.created_at))
            .limit(1)
        )
        analysis = result.scalar_one_or_none()
        if not analysis:
            raise HTTPException(status_code=404, detail="No analysis found")
        analysis_id = analysis.id
    
    # Get analysis
    result = await db.execute(
        select(Analysis).where(Analysis.id == analysis_id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Get violations
    result = await db.execute(
        select(Violation).where(Violation.analysis_id == analysis_id)
    )
    violations = result.scalars().all()
    
    # Get graph snapshot from history
    result = await db.execute(
        select(ArchitectureHistory)
        .where(ArchitectureHistory.analysis_id == analysis_id)
        .order_by(desc(ArchitectureHistory.timestamp))
        .limit(1)
    )
    history = result.scalar_one_or_none()
    
    if not history or not history.graph_snapshot:
        raise HTTPException(status_code=404, detail="Graph data not found")
    
    graph_data = history.graph_snapshot
    
    print(f"Graph data keys: {graph_data.keys()}")
    print(f"Number of nodes: {len(graph_data.get('nodes', []))}")
    print(f"Number of edges: {len(graph_data.get('edges', []))}")
    
    # Create violation lookup
    violation_edges = {}
    for viol in violations:
        key = f"{viol.source_module}-{viol.target_module}"
        violation_edges[key] = {
            'type': viol.type,
            'severity': viol.severity,
            'label': viol.title
        }
    
    # Build response nodes
    nodes = []
    for node_data in graph_data['nodes']:
        # Determine severity from violations
        node_violations = [v for v in violations if v.source_module == node_data['id'] or v.target_module == node_data['id']]
        severity = None
        if node_violations:
            # Get highest severity
            severity_order = ['critical', 'high', 'medium', 'low']
            for sev in severity_order:
                if any(v.severity == sev for v in node_violations):
                    severity = sev
                    break
        
        nodes.append(NodeData(
            id=node_data['id'],
            label=node_data.get('label', node_data['id']),
            layer=node_data.get('layer', 'unknown'),
            severity=severity,
            file_path=node_data.get('file_path'),
            module_type=None
        ))
    
    # Build response edges
    edges = []
    edges_data = graph_data.get('edges', [])
    print(f"Processing {len(edges_data)} edges from graph data")
    
    for edge_data in edges_data:
        edge_id = f"{edge_data['from']}-{edge_data['to']}"
        violation_info = violation_edges.get(edge_id)
        
        print(f"Edge: {edge_data['from']} -> {edge_data['to']}, violation: {bool(violation_info)}")
        
        # Apply settings: optionally highlight violations
        is_violation = bool(violation_info) if settings.architecture.highlight_forbidden_edges else False
        
        edges.append(EdgeData(
            id=edge_id,
            from_node=edge_data['from'],
            to_node=edge_data['to'],
            is_violation=is_violation,
            violation_type=violation_info['type'] if violation_info else None,
            violation_label=violation_info['label'] if violation_info else None,
            dependency_type='import'
        ))
    
    print(f"Created {len(edges)} EdgeData objects")
    
    # Build layer definitions
    # Apply settings: optionally show layer boundaries
    layers = []
    if settings.architecture.show_layer_boundaries:
        layers = [
            LayerDefinition(name='presentation', level=0, allowed_dependencies=['gateway'], description='UI and client applications'),
            LayerDefinition(name='gateway', level=1, allowed_dependencies=['service'], description='API Gateway layer'),
            LayerDefinition(name='service', level=2, allowed_dependencies=['data'], description='Business logic and services'),
            LayerDefinition(name='data', level=3, allowed_dependencies=[], description='Data access layer'),
            LayerDefinition(name='legacy', level=4, allowed_dependencies=[], description='Legacy systems')
        ]
    
    return ArchitectureMap(
        nodes=nodes,
        edges=edges,
        layers=layers,
        metadata={
            'analysis_id': analysis_id,
            'timestamp': analysis.created_at.isoformat(),
            'total_violations': analysis.total_violations
        }
    )


@router.get("/violations", response_model=List[ViolationSummary])
async def get_violations(
    analysis_id: Optional[str] = None,
    severity: Optional[str] = None,
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of architecture violations.
    Supports filtering by severity and type.
    """
    # Get latest analysis if no ID provided
    if not analysis_id:
        result = await db.execute(
            select(Analysis)
            .where(Analysis.status == 'success')
            .order_by(desc(Analysis.created_at))
            .limit(1)
        )
        analysis = result.scalar_one_or_none()
        if analysis:
            analysis_id = analysis.id
    
    # Build query
    query = select(Violation)
    if analysis_id:
        query = query.where(Violation.analysis_id == analysis_id)
    if severity:
        query = query.where(Violation.severity == severity)
    if type:
        query = query.where(Violation.type == type)
    
    query = query.order_by(desc(Violation.created_at))
    
    result = await db.execute(query)
    violations = result.scalars().all()
    
    return [
        ViolationSummary(
            id=v.id,
            title=v.title,
            severity=v.severity,
            type=v.type,
            source_module=v.source_module,
            target_module=v.target_module,
            timestamp=v.created_at
        )
        for v in violations
    ]


@router.get("/violations/{violation_id}", response_model=ViolationDetail)
async def get_violation_detail(
    violation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific violation.
    Includes AI explanation and suggested fix.
    """
    result = await db.execute(
        select(Violation).where(Violation.id == violation_id)
    )
    violation = result.scalar_one_or_none()
    
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    return ViolationDetail(
        id=violation.id,
        type=violation.type,
        severity=violation.severity,
        title=violation.title,
        description=violation.description,
        source_module=violation.source_module,
        target_module=violation.target_module,
        dependency_path=violation.dependency_path,
        rule_name=violation.rule_name,
        pattern_broken=violation.pattern_broken,
        timestamp=violation.created_at,
        ai_explanation=violation.ai_explanation,
        suggested_fix=violation.suggested_fix
    )
    
    # Note: History endpoints have been moved to history_endpoints.py
    # See /api/history for MongoDB-based history tracking
