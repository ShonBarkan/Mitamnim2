import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base

# --- ASSOCIATION TABLES (MANY-TO-MANY) ---

exercise_parameters_map = Table(
    "exercise_parameters_map",
    Base.metadata,
    Column("exercise_id", Integer, ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
    Column("parameter_id", Integer, ForeignKey("parameters.id", ondelete="CASCADE"), primary_key=True)
)

exercise_tags_map = Table(
    "exercise_tags_map",
    Base.metadata,
    Column("exercise_id", Integer, ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)

# --- DATABASE MODELS ---

class Exercise(Base):
    """SQLAlchemy model for group-isolated athletic exercises."""
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    parameters = relationship("Parameter", secondary=exercise_parameters_map, lazy="selectin")
    tags = relationship("Tag", secondary=exercise_tags_map, lazy="selectin")

# --- PYDANTIC SCHEMAS ---

from domains.parameters.models import ParameterOut
from domains.tags.models import TagOut

class ExerciseBase(BaseModel):
    name: str

class ExerciseCreate(ExerciseBase):
    parameter_ids: List[int] = []
    tag_ids: List[int] = []

class ExerciseOut(ExerciseBase):
    id: int
    group_id: uuid.UUID
    created_at: datetime
    parameters: List[ParameterOut] = []
    tags: List[TagOut] = []

    model_config = ConfigDict(from_attributes=True)