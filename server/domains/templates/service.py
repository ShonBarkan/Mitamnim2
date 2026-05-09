from typing import List, Optional
from sqlalchemy.orm import Session

from .models import WorkoutTemplate, WorkoutTemplateCreate, WorkoutTemplateUpdate
from ..users.models import User


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
