import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Session
from pydantic import BaseModel, ConfigDict
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
    Stores exercise configurations and scheduling data as JSONB.
    """
    __tablename__ = "workout_templates"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    parent_exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # JSONB field storing List[ExerciseInTemplate] structure
    exercises_config = Column(JSONB, nullable=False)

    # JSONB field storing a list of user IDs (strings) authorized for this template
    for_users = Column(JSONB, server_default='[]')

    # JSONB field storing integers representing days of the week (0-6)
    scheduled_days = Column(JSONB, server_default='[]')

    expected_duration_time = Column(String, nullable=True)
    scheduled_hour = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("Group")
    parent_exercise = relationship("ExerciseTree")


# --- Pydantic Schemas ---

class ParamInExercise(BaseModel):
    """Schema for a specific parameter setting within a template exercise."""
    parameter_id: int
    parameter_name: str
    parameter_unit: str
    value: str


class ExerciseInTemplate(BaseModel):
    """Schema for an exercise configuration within a workout template."""
    exercise_id: int
    exercise_name: str
    num_of_sets: int
    params: List[ParamInExercise]


class WorkoutTemplateBase(BaseModel):
    """Shared base schema for workout templates."""
    name: str
    description: Optional[str] = None
    parent_exercise_id: Optional[int] = None
    exercises_config: List[ExerciseInTemplate]
    for_users: List[uuid.UUID] = []
    scheduled_days: List[int] = []
    expected_duration_time: Optional[str] = None
    scheduled_hour: Optional[str] = None


class WorkoutTemplateCreate(WorkoutTemplateBase):
    """Schema for template creation."""
    pass


class WorkoutTemplateUpdate(BaseModel):
    """Schema for partial template updates."""
    name: Optional[str] = None
    description: Optional[str] = None
    parent_exercise_id: Optional[int] = None
    exercises_config: Optional[List[ExerciseInTemplate]] = None
    for_users: Optional[List[uuid.UUID]] = None
    scheduled_days: Optional[List[int]] = None
    expected_duration_time: Optional[str] = None
    scheduled_hour: Optional[str] = None


class WorkoutTemplateOut(WorkoutTemplateBase):
    """Schema for template output."""
    id: int
    group_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- WorkoutTemplateService (Business Logic Class) ---

class WorkoutTemplateService:
    """
    Service layer for managing workout templates.
    Handles data serialization for JSONB fields and permission-based filtering.
    """

    def __init__(self, db: Session):
        """Initializes the service with a database session."""
        self.db = db

    def create_template(self, user: User, data: WorkoutTemplateCreate) -> WorkoutTemplate:
        """Initializes and saves a new workout template for the user's group."""
        # Convert UUIDs and Pydantic models to serializable formats for JSONB
        users_list = [str(u) for u in data.for_users]
        config_list = [item.model_dump() for item in data.exercises_config]

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
        """
        Retrieves templates accessible to the user.
        - Trainers/Admins: See all templates in the group.
        - Trainees: See templates assigned specifically to them or global group templates.
        """
        query = self.db.query(WorkoutTemplate).filter(
            WorkoutTemplate.group_id == user.group_id
        )

        all_templates = query.all()

        if user.role in ['trainer', 'admin']:
            return all_templates

        # Filter for trainees based on 'for_users' JSONB content
        accessible = []
        user_id_str = str(user.id)
        for tmpl in all_templates:
            # Accessible if no specific users assigned or if user is in the list
            if not tmpl.for_users or len(tmpl.for_users) == 0 or user_id_str in tmpl.for_users:
                accessible.append(tmpl)

        return accessible

    def update_template(self, template_id: int, user: User, update_data: WorkoutTemplateUpdate) -> Optional[
        WorkoutTemplate]:
        """Performs partial updates on a template after ownership and role validation."""
        db_template = self.db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            WorkoutTemplate.group_id == user.group_id
        ).first()

        if not db_template:
            return None

        data_dict = update_data.model_dump(exclude_unset=True)

        # Handle nested serialization for JSONB updates
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
        """Removes a template record from the database."""
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
    """Creates a new workout template (Trainer/Admin only)."""
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    service = WorkoutTemplateService(db)
    return service.create_template(current_user, data)


@router.get("", response_model=List[WorkoutTemplateOut])
async def list_templates(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all templates available to the current user."""
    service = WorkoutTemplateService(db)
    return service.get_group_templates(current_user)


@router.patch("/{template_id}", response_model=WorkoutTemplateOut)
async def update_template(
        template_id: int,
        data: WorkoutTemplateUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates an existing template (Trainer/Admin only)."""
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    service = WorkoutTemplateService(db)
    updated = service.update_template(template_id, current_user, data)

    if not updated:
        raise HTTPException(status_code=404, detail="Template not found or access denied")
    return updated


@router.delete("/{template_id}")
async def remove_template(
        template_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Deletes a workout template (Trainer/Admin only)."""
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    service = WorkoutTemplateService(db)
    if not service.delete_template(template_id, current_user):
        raise HTTPException(status_code=404, detail="Template not found or access denied")

    return {"detail": "Template deleted successfully"}