"""
History service for managing analysis snapshots.
"""
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.db.mongodb import get_database
from app.models.history_schemas import (
    AnalysisSnapshotDocument, SnapshotListItem, 
    SnapshotComparison, ViolationSnapshot
)


class HistoryService:
    """Service for managing analysis history in MongoDB."""
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.analysis_snapshots
    
    async def save_snapshot(self, snapshot: AnalysisSnapshotDocument) -> str:
        """
        Save an analysis snapshot to MongoDB.
        Returns the snapshot ID.
        """
        snapshot_dict = snapshot.dict(by_alias=True, exclude={"id"})
        result = await self.collection.insert_one(snapshot_dict)
        return str(result.inserted_id)
    
    async def list_snapshots(
        self, 
        repo_name: Optional[str] = None,
        limit: int = 50
    ) -> List[SnapshotListItem]:
        """
        List analysis snapshots, optionally filtered by repo.
        Returns lightweight snapshot list items.
        """
        query = {}
        if repo_name:
            query["repo.name"] = repo_name
        
        cursor = self.collection.find(query).sort("timestamp", -1).limit(limit)
        snapshots = await cursor.to_list(length=limit)
        
        return [
            SnapshotListItem(
                id=str(doc["_id"]),
                timestamp=doc["timestamp"],
                summary=doc["summary"]
            )
            for doc in snapshots
        ]
    
    async def get_snapshot(self, snapshot_id: str) -> Optional[AnalysisSnapshotDocument]:
        """Get a specific snapshot by ID."""
        if not ObjectId.is_valid(snapshot_id):
            return None
        
        doc = await self.collection.find_one({"_id": ObjectId(snapshot_id)})
        if not doc:
            return None
        
        doc["_id"] = str(doc["_id"])
        return AnalysisSnapshotDocument(**doc)
    
    async def compare_snapshots(
        self, 
        from_id: str, 
        to_id: str
    ) -> Optional[SnapshotComparison]:
        """
        Compare two snapshots and return differences.
        Comparison is done in application logic.
        """
        from_snapshot = await self.get_snapshot(from_id)
        to_snapshot = await self.get_snapshot(to_id)
        
        if not from_snapshot or not to_snapshot:
            return None
        
        # Create violation keys for comparison
        def violation_key(v: ViolationSnapshot) -> str:
            return f"{v.type}:{v.from_module}:{v.to_module}"
        
        from_violations = {violation_key(v): v for v in from_snapshot.violations}
        to_violations = {violation_key(v): v for v in to_snapshot.violations}
        
        # Find added and resolved violations
        added = [
            v for k, v in to_violations.items() 
            if k not in from_violations
        ]
        resolved = [
            v for k, v in from_violations.items() 
            if k not in to_violations
        ]
        
        # Calculate summary changes
        summary_change = {
            "total": to_snapshot.summary.total - from_snapshot.summary.total,
            "critical": to_snapshot.summary.critical - from_snapshot.summary.critical,
            "high": to_snapshot.summary.high - from_snapshot.summary.high,
            "medium": to_snapshot.summary.medium - from_snapshot.summary.medium,
            "low": to_snapshot.summary.low - from_snapshot.summary.low,
        }
        
        return SnapshotComparison(
            from_id=from_id,
            to_id=to_id,
            from_timestamp=from_snapshot.timestamp,
            to_timestamp=to_snapshot.timestamp,
            added_violations=added,
            resolved_violations=resolved,
            summary_change=summary_change
        )
    
    async def get_latest_snapshot(
        self, 
        repo_name: str, 
        branch: str = "main"
    ) -> Optional[AnalysisSnapshotDocument]:
        """Get the most recent snapshot for a repository."""
        doc = await self.collection.find_one(
            {"repo.name": repo_name, "repo.branch": branch},
            sort=[("timestamp", -1)]
        )
        
        if not doc:
            return None
        
        doc["_id"] = str(doc["_id"])
        return AnalysisSnapshotDocument(**doc)
