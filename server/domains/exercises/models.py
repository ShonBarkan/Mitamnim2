import uuid
from typing import List, Optional
from sqlalchemy import Column, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from db.database import Base

# --- DATABASE RELATION LAYERS ---

class ExerciseParameter(Base):
    """Many-to-many link table connecting exercises directly with measurement parameters."""
    __tablename__ = "exercise_parameters"

    exercise_id = Column(Integer, ForeignKey("group_exercise_registry.id", ondelete="CASCADE"), primary_key=True)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="CASCADE"), primary_key=True)


class GroupExerciseRegistry(Base):
    """Core flat registry repository containing unique group workout exercise definitions."""
    __tablename__ = "group_exercise_registry"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    category = Column(Text, default="General")

    # Enforce database-level uniqueness per exercise name within a specific group
    __table_args__ = (UniqueConstraint('group_id', 'name', name='unique_group_exercise'),)

    # Clean many-to-many relationship using secondary table linkage for high-performance joins
    parameters = relationship(
        "Parameter",
        secondary="exercise_parameters",
        cascade="all, delete"
    )


# --- PYDANTIC SCHEMAS ---

class ExerciseBase(BaseModel):
    """Base schema for Exercise structural configuration data payload."""
    name: str
    category: Optional[str] = "General"


class ExerciseCreate(ExerciseBase):
    """Schema used for creating a new exercise and mapping its target parameter bindings."""
    active_parameter_ids: List[int]


class ExerciseUpdate(BaseModel):
    """Schema optimized for partial modifications across exercise registry nodes."""
    name: Optional[str] = None
    category: Optional[str] = None
    active_parameter_ids: Optional[List[int]] = None


class ExerciseBatchRequest(BaseModel):
    """Payload schema tracking a collection of integer exercise identifiers for bulk retrieval."""
    exercise_ids: List[int]


class ExerciseOut(ExerciseBase):
    """Output serialization matrix enriched with database identifier fields."""
    id: int
    group_id: uuid.UUID
    active_parameter_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)