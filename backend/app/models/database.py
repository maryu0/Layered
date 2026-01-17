"""
SQLAlchemy database models for persisting analysis results.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class Analysis(Base):
    """Represents a complete repository analysis session."""
    __tablename__ = "analyses"

    id = Column(String, primary_key=True)
    repo_path = Column(String, nullable=False)
    branch = Column(String, default="main")
    commit_hash = Column(String, nullable=True)
    status = Column(String, default="in_progress")  # in_progress, success, failed
    total_modules = Column(Integer, default=0)
    total_dependencies = Column(Integer, default=0)
    total_violations = Column(Integer, default=0)
    violations_by_severity = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)

    # Relationships
    violations = relationship("Violation", back_populates="analysis", cascade="all, delete-orphan")
    modules = relationship("Module", back_populates="analysis", cascade="all, delete-orphan")


class Module(Base):
    """Represents a code module/service in the architecture."""
    __tablename__ = "modules"

    id = Column(String, primary_key=True)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    layer = Column(String, nullable=True)
    module_type = Column(String, nullable=True)  # service, database, gateway, etc.
    severity = Column(String, nullable=True)  # if module itself has issues

    # Relationships
    analysis = relationship("Analysis", back_populates="modules")


class Violation(Base):
    """Represents an architecture violation."""
    __tablename__ = "violations"

    id = Column(String, primary_key=True)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    type = Column(String, nullable=False)  # layer_violation, circular_dependency, etc.
    severity = Column(String, nullable=False)  # low, medium, high, critical
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    source_module = Column(String, nullable=False)
    target_module = Column(String, nullable=False)
    dependency_path = Column(JSON, nullable=False)  # List of modules in violation path
    rule_name = Column(String, nullable=False)
    pattern_broken = Column(String, nullable=False)
    ai_explanation = Column(Text, nullable=True)
    suggested_fix = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    analysis = relationship("Analysis", back_populates="violations")


class ArchitectureHistory(Base):
    """Historical snapshots of architecture state for drift tracking."""
    __tablename__ = "architecture_history"

    id = Column(String, primary_key=True)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    commit_hash = Column(String, nullable=True)
    total_violations = Column(Integer, default=0)
    violations_by_type = Column(JSON, default={})
    violations_by_severity = Column(JSON, default={})
    graph_snapshot = Column(JSON, nullable=True)  # Serialized graph structure
