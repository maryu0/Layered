"""
Pydantic models for MongoDB history tracking.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    """Custom type for MongoDB ObjectId."""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


class RepositoryInfo(BaseModel):
    """Repository identification."""
    name: str
    branch: str = "main"


class NodeSnapshot(BaseModel):
    """Node in architecture graph."""
    id: str
    label: str
    layer: str
    severity: Optional[str] = None


class EdgeSnapshot(BaseModel):
    """Edge in architecture graph."""
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    violates: bool = False
    
    class Config:
        populate_by_name = True


class ArchitectureSnapshot(BaseModel):
    """Architecture state at a point in time."""
    layers: List[str]
    nodes: List[NodeSnapshot]
    edges: List[EdgeSnapshot]


class ViolationSnapshot(BaseModel):
    """Violation record."""
    type: str
    rule: str
    severity: str
    from_module: str = Field(alias="from")
    to_module: str = Field(alias="to")
    title: str
    description: str
    
    class Config:
        populate_by_name = True


class ViolationSummary(BaseModel):
    """Violation count summary."""
    total: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0


class AnalysisSnapshotDocument(BaseModel):
    """Complete analysis snapshot for MongoDB."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    repo: RepositoryInfo
    timestamp: datetime
    architecture: ArchitectureSnapshot
    violations: List[ViolationSnapshot]
    summary: ViolationSummary
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class SnapshotListItem(BaseModel):
    """Lightweight snapshot for list view."""
    id: str
    timestamp: datetime
    summary: ViolationSummary


class SnapshotComparison(BaseModel):
    """Comparison between two snapshots."""
    from_id: str
    to_id: str
    from_timestamp: datetime
    to_timestamp: datetime
    added_violations: List[ViolationSnapshot]
    resolved_violations: List[ViolationSnapshot]
    summary_change: Dict[str, int]  # e.g., {"critical": +1, "high": -2}
