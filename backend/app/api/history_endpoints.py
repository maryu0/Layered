"""
History API endpoints for tracking architecture drift over time.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional

from app.services.history_service import HistoryService
from app.models.history_schemas import (
    SnapshotListItem, AnalysisSnapshotDocument, SnapshotComparison
)

history_router = APIRouter(prefix="/history", tags=["history"])


@history_router.get("", response_model=List[SnapshotListItem])
async def list_history(repo: Optional[str] = None, limit: int = 50):
    """
    List analysis snapshots, optionally filtered by repository.
    Returns a timeline of past analyses.
    """
    service = HistoryService()
    return await service.list_snapshots(repo_name=repo, limit=limit)


@history_router.get("/{snapshot_id}", response_model=AnalysisSnapshotDocument)
async def get_snapshot(snapshot_id: str):
    """
    Get a specific snapshot by ID.
    Returns the full architecture map and violations for that point in time.
    """
    service = HistoryService()
    snapshot = await service.get_snapshot(snapshot_id)
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    return snapshot


@history_router.get("/compare/{from_id}/{to_id}", response_model=SnapshotComparison)
async def compare_snapshots(from_id: str, to_id: str):
    """
    Compare two snapshots to see what changed.
    Returns added violations, resolved violations, and summary changes.
    """
    service = HistoryService()
    comparison = await service.compare_snapshots(from_id, to_id)
    
    if not comparison:
        raise HTTPException(
            status_code=404, 
            detail="One or both snapshots not found"
        )
    
    return comparison
