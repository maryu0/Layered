"""
Pydantic models for request/response schemas.
Frontend-friendly data structures.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class ViolationSeverity(str, Enum):
    """Severity levels for architecture violations."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ViolationType(str, Enum):
    """Types of architecture violations."""
    LAYER_VIOLATION = "layer_violation"
    FORBIDDEN_DEPENDENCY = "forbidden_dependency"
    CIRCULAR_DEPENDENCY = "circular_dependency"
    LEGACY_ACCESS = "legacy_access"
    BYPASS_GATEWAY = "bypass_gateway"


class NodeData(BaseModel):
    """Graph node representation."""
    id: str
    label: str
    layer: str
    severity: Optional[ViolationSeverity] = None
    file_path: Optional[str] = None
    module_type: Optional[str] = None  # 'service', 'database', 'gateway', etc.


class EdgeData(BaseModel):
    """Graph edge representation."""
    id: str
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    is_violation: bool = False
    violation_type: Optional[ViolationType] = None
    violation_label: Optional[str] = None
    dependency_type: str = "import"  # 'import', 'api_call', 'database_access'

    class Config:
        populate_by_name = True


class LayerDefinition(BaseModel):
    """Architecture layer definition."""
    name: str
    level: int  # 0=top, higher=deeper
    allowed_dependencies: List[str]  # Can depend on these layers
    description: Optional[str] = None


class ArchitectureMap(BaseModel):
    """Complete architecture graph for frontend."""
    nodes: List[NodeData]
    edges: List[EdgeData]
    layers: List[LayerDefinition]
    metadata: Dict[str, Any] = {}


class ViolationDetail(BaseModel):
    """Detailed violation information."""
    id: str
    type: ViolationType
    severity: ViolationSeverity
    title: str
    description: str
    source_module: str
    target_module: str
    dependency_path: List[str]
    rule_name: str
    pattern_broken: str
    timestamp: datetime
    ai_explanation: Optional[str] = None
    suggested_fix: Optional[str] = None


class ViolationSummary(BaseModel):
    """Lightweight violation for list views."""
    id: str
    title: str
    severity: ViolationSeverity
    type: ViolationType
    source_module: str
    target_module: str
    timestamp: datetime


class AnalysisRequest(BaseModel):
    """Request to analyze a repository."""
    repo_path: str
    branch: Optional[str] = "main"
    include_tests: bool = False


class AnalysisResult(BaseModel):
    """Result of repository analysis."""
    analysis_id: str
    status: str  # 'success', 'failed', 'in_progress'
    total_modules: int
    total_dependencies: int
    total_violations: int
    violations_by_severity: Dict[str, int]
    timestamp: datetime
    duration_seconds: float


class ArchitectureSnapshot(BaseModel):
    """Historical architecture state."""
    id: str
    timestamp: datetime
    commit_hash: Optional[str] = None
    total_violations: int
    violations_by_type: Dict[str, int]
    violations_by_severity: Dict[str, int]


class HealthCheck(BaseModel):
    """API health check response."""
    status: str
    version: str
    timestamp: datetime
