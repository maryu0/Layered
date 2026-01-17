"""
Settings schemas for configuring analysis behavior.
"""
from pydantic import BaseModel, Field, validator
from typing import Literal
from enum import Enum


class SeverityThreshold(str, Enum):
    """Minimum severity level to display."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ExplanationDetail(str, Enum):
    """Level of detail for AI explanations."""
    BRIEF = "BRIEF"
    STANDARD = "STANDARD"


class AnalysisSettings(BaseModel):
    """Analysis behavior configuration."""
    detect_circular_dependencies: bool = Field(
        default=True,
        description="Detect circular dependency patterns"
    )
    detect_legacy_access: bool = Field(
        default=True,
        description="Detect access to legacy modules"
    )
    severity_threshold: SeverityThreshold = Field(
        default=SeverityThreshold.MEDIUM,
        description="Minimum severity level to report"
    )


class ArchitectureSettings(BaseModel):
    """Architecture visualization configuration."""
    show_layer_boundaries: bool = Field(
        default=True,
        description="Display layer groupings in graph"
    )
    highlight_forbidden_edges: bool = Field(
        default=True,
        description="Highlight violations in red"
    )


class AISettings(BaseModel):
    """AI explanation configuration."""
    enable_explanations: bool = Field(
        default=True,
        description="Generate AI explanations for violations"
    )
    explanation_detail: ExplanationDetail = Field(
        default=ExplanationDetail.STANDARD,
        description="Level of detail in explanations"
    )


class AppSettings(BaseModel):
    """Complete application settings."""
    analysis: AnalysisSettings = Field(default_factory=AnalysisSettings)
    architecture: ArchitectureSettings = Field(default_factory=ArchitectureSettings)
    ai: AISettings = Field(default_factory=AISettings)

    class Config:
        schema_extra = {
            "example": {
                "analysis": {
                    "detect_circular_dependencies": True,
                    "detect_legacy_access": True,
                    "severity_threshold": "MEDIUM"
                },
                "architecture": {
                    "show_layer_boundaries": True,
                    "highlight_forbidden_edges": True
                },
                "ai": {
                    "enable_explanations": True,
                    "explanation_detail": "STANDARD"
                }
            }
        }
