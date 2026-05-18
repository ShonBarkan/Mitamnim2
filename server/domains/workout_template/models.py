import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from db.database import Base


# --- DATABASE MODELS ---

class WorkoutTemplate(Base):
    """Core lookup header representing a reusable group workout schedule or skeleton blueprint."""
    __tablename__ = "workout_templates"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    expected_duration_time = Column(Text, nullable=True)
    scheduled_hour = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relational join paths mapping child configuration nodes
    template_exercises = relationship("TemplateExercise", back_populates="template", cascade="all, delete-orphan")
    assignments = relationship("TemplateUserAssignment", back_populates="template", cascade="all, delete-orphan")
    schedules = relationship("TemplateScheduleDay", back_populates="template", cascade="all, delete-orphan")


class TemplateExercise(Base):
    """Maps exercises assigned to a template layout skeleton node."""
    __tablename__ = "template_exercises"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("group_exercise_registry.id", ondelete="CASCADE"), nullable=False)
    num_of_sets = Column(Integer, default=1, nullable=False)

    template = relationship("WorkoutTemplate", back_populates="template_exercises")
    exercise = relationship("GroupExerciseRegistry")
    parameter_values = relationship("TemplateExerciseParameter", back_populates="template_exercise",
                                    cascade="all, delete-orphan")


class TemplateExerciseParameter(Base):
    """
    Maps baseline metric parameters and values linked to a specific template exercise.
    Utilizes a composite primary key layout and maps to physical column names accurately.
    """
    __tablename__ = "template_exercise_parameters"

    template_exercise_id = Column(Integer, ForeignKey("template_exercises.id", ondelete="CASCADE"), primary_key=True,
                                  nullable=False)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    target_value = Column("value", Text, nullable=False)

    template_exercise = relationship("TemplateExercise", back_populates="parameter_values")
    parameter = relationship("Parameter")


class TemplateUserAssignment(Base):
    """Relational join table binding templates out to specific target trainees."""
    __tablename__ = "template_user_assignments"

    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    template = relationship("WorkoutTemplate", back_populates="assignments")


class TemplateScheduleDay(Base):
    """Relational lookup recording weekly recurring days (0-6) mapped to template profiles."""
    __tablename__ = "template_schedule_days"

    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="CASCADE"), primary_key=True)
    day_of_week = Column(Integer, primary_key=True)  # 0 = Monday, 6 = Sunday standard scale

    template = relationship("WorkoutTemplate", back_populates="schedules")


# --- PYDANTIC SCHEMAS ---

class ParamInExerciseSchema(BaseModel):
    parameter_id: int
    target_value: str


class ExerciseInTemplateSchema(BaseModel):
    # Field properties adjusted to Optional to allow clean processing of structural inline custom exercise assets
    exercise_id: Optional[int] = None
    exercise_name: Optional[str] = None
    num_of_sets: int
    params: List[ParamInExerciseSchema]


class WorkoutTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    expected_duration_time: Optional[str] = None
    scheduled_hour: Optional[str] = None
    exercises: List[ExerciseInTemplateSchema]
    for_users: List[uuid.UUID] = []
    scheduled_days: List[int] = []


class WorkoutTemplateCreate(WorkoutTemplateBase):
    pass


class WorkoutTemplateOut(BaseModel):
    id: int
    group_id: uuid.UUID
    name: str
    description: Optional[str]
    expected_duration_time: Optional[str]
    scheduled_hour: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)