import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Session
from pydantic import BaseModel, ConfigDict, Field
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and security imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User
from domains.exercises import ExerciseTree
from domains.groups import Group


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


# --- WorkoutTemplateService ---

class WorkoutTemplateService:
    """
    Manages the logic for workout templates.
    Ensures UUIDs and Pydantic models are correctly serialized for JSONB storage.
    """

    def __init__(self, db: Session):
        self.db = db

    def create_template(self, user: User, data: WorkoutTemplateCreate) -> WorkoutTemplate:
        """Saves a new template, ensuring JSONB fields are properly formatted."""
        users_list = [str(u) for u in data.for_users]

        # Serialize the exercises_config using model_dump to convert Pydantic to Dict
        config_list = [exercise.model_dump() for exercise in data.exercises_config]

        db_template = WorkoutTemplate(
            group_id=user.group_id,
            parent_exercise_id=data.parent_exercise_id,
            name=data.name,
            description=data.description,
            exercises_config=config_list,
            for_users=users_list,
            scheduled_days=data.scheduled_days,
            expected_duration_time=data.expected_duration_time,
            scheduled_hour=data.scheduled_hour
        )

        self.db.add(db_template)
        self.db.commit()
        self.db.refresh(db_template)
        return db_template

    def get_group_templates(self, user: User) -> List[WorkoutTemplate]:
        """Fetches templates with role-based filtering for trainees."""
        query = self.db.query(WorkoutTemplate).filter(
            WorkoutTemplate.group_id == user.group_id
        )

        all_templates = query.all()

        if user.role in ['trainer', 'admin']:
            return all_templates

        accessible = []
        user_id_str = str(user.id)
        for tmpl in all_templates:
            # Accessible if global (no for_users) or if trainee is specifically assigned
            if not tmpl.for_users or len(tmpl.for_users) == 0 or user_id_str in tmpl.for_users:
                accessible.append(tmpl)

        return accessible

    def update_template(self, template_id: int, user: User, update_data: WorkoutTemplateUpdate) -> Optional[
        WorkoutTemplate]:
        """Updates a template after validating group membership."""
        db_template = self.db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            WorkoutTemplate.group_id == user.group_id
        ).first()

        if not db_template:
            return None

        data_dict = update_data.model_dump(exclude_unset=True)

        if "exercises_config" in data_dict:
            data_dict["exercises_config"] = [item.model_dump() for item in update_data.exercises_config]
        if "for_users" in data_dict:
            data_dict["for_users"] = [str(u) for u in update_data.for_users]

        for key, value in data_dict.items():
            setattr(db_template, key, value)

        self.db.commit()
        self.db.refresh(db_template)
        return db_template

    def delete_template(self, template_id: int, user: User) -> bool:
        """Deletes a template if it belongs to the user's group."""
        db_template = self.db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            WorkoutTemplate.group_id == user.group_id
        ).first()

        if not db_template:
            return False

        self.db.delete(db_template)
        self.db.commit()
        return True


# --- Router Setup ---

router = APIRouter(prefix="/workout-templates", tags=["Workout Templates"])


@router.post("", response_model=WorkoutTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
        data: WorkoutTemplateCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    service = WorkoutTemplateService(db)
    return service.create_template(current_user, data)


@router.get("", response_model=List[WorkoutTemplateOut])
async def list_templates(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = WorkoutTemplateService(db)
    return service.get_group_templates(current_user)


@router.patch("/{template_id}", response_model=WorkoutTemplateOut)
async def update_template(
        template_id: int,
        data: WorkoutTemplateUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    service = WorkoutTemplateService(db)
    updated = service.update_template(template_id, current_user, data)

    if not updated:
        raise HTTPException(status_code=404, detail="Template not found")
    return updated


@router.delete("/{template_id}")
async def remove_template(
        template_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    service = WorkoutTemplateService(db)
    if not service.delete_template(template_id, current_user):
        raise HTTPException(status_code=404, detail="Template not found")

    return {"detail": "Template deleted successfully"}