import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict, Field

from db.database import Base


# --- Database Model ---

class WorkoutTemplate(Base):
    """
    SQLAlchemy model representing a reusable workout plan.
    exercises_config stores exercise_id, num_of_sets, and a list of
    parameter IDs with their manual or calculated values.
    """
    __tablename__ = "workout_templates"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    parent_exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # JSONB structure: List[ExerciseInTemplate]
    exercises_config = Column(JSONB, nullable=False)

    # JSONB structure: List[str] (User UUIDs)
    for_users = Column(JSONB, server_default='[]')

    # JSONB structure: List[int] (0-6)
    scheduled_days = Column(JSONB, server_default='[]')

    expected_duration_time = Column(String, nullable=True)
    scheduled_hour = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group")
    parent_exercise = relationship("ExerciseTree")


# --- Pydantic Schemas ---

class ParamInExercise(BaseModel):
    """
    Schema for a specific parameter within an exercise.
    As requested, stores only the ID and the value (manual or calculated).
    """
    parameter_id: int
    value: str


class ExerciseInTemplate(BaseModel):
    """
    Configuration for an exercise within a template.
    Includes the exercise identity, sets, and its specific parameter values.
    """
    exercise_id: int
    exercise_name: str
    num_of_sets: int
    params: List[ParamInExercise]


class WorkoutTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_exercise_id: Optional[int] = None
    exercises_config: List[ExerciseInTemplate]
    for_users: List[uuid.UUID] = []
    scheduled_days: List[int] = []
    expected_duration_time: Optional[str] = None
    scheduled_hour: Optional[str] = None


class WorkoutTemplateCreate(WorkoutTemplateBase):
    pass


class WorkoutTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_exercise_id: Optional[int] = None
    exercises_config: Optional[List[ExerciseInTemplate]] = None
    for_users: Optional[List[uuid.UUID]] = None
    scheduled_days: Optional[List[int]] = None
    expected_duration_time: Optional[str] = None
    scheduled_hour: Optional[str] = None


class WorkoutTemplateOut(WorkoutTemplateBase):
    id: int
    group_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
