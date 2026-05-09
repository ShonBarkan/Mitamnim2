import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict

from db.database import Base


# --- Database Model ---

class StatsDashboardConfig(Base):
    """
    SQLAlchemy model for group-specific dashboard visualization settings.
    Determines which exercises and parameters appear on the public leaderboard.
    """
    __tablename__ = "stats_dashboard_config"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=False)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="SET NULL"), nullable=True)
    ranking_direction = Column(String, default="desc")  # 'desc' for high scores, 'asc' for speed/time
    aggregation_override = Column(String, nullable=True)  # Optional: 'sum', 'max', 'avg'
    time_frame = Column(String, nullable=True)  # Optional: 'all_time', 'monthly', 'weekly'
    display_order = Column(Integer, default=0)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("Group")
    exercise = relationship("ExerciseTree")
    parameter = relationship("Parameter")


# --- Pydantic Schemas ---

class DashboardConfigBase(BaseModel):
    """Shared fields for dashboard configuration."""
    exercise_id: int
    parameter_id: Optional[int] = None
    ranking_direction: str = "desc"
    aggregation_override: Optional[str] = None
    time_frame: Optional[str] = None
    display_order: int = 0
    is_public: bool = True


class DashboardConfigCreate(DashboardConfigBase):
    """Schema for creating a new dashboard entry."""
    pass


class DashboardConfigUpdate(BaseModel):
    """Schema for partial updates (e.g., drag-and-drop reordering or field edits)."""
    exercise_id: Optional[int] = None
    parameter_id: Optional[int] = None
    ranking_direction: Optional[str] = None
    aggregation_override: Optional[str] = None
    time_frame: Optional[str] = None
    display_order: Optional[int] = None
    is_public: Optional[bool] = None


class DashboardConfigOut(DashboardConfigBase):
    """Output schema including system-generated metadata."""
    id: int
    group_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
