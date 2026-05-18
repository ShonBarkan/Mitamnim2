import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from domains.workout_template.models import (
    WorkoutTemplate, TemplateExercise, TemplateExerciseParameter,
    TemplateUserAssignment, TemplateScheduleDay
)
from core.logger import logger


class TemplateService:
    @staticmethod
    def get_group_templates(db: Session, group_id: uuid.UUID) -> List[WorkoutTemplate]:
        """Retrieves templates for a group pre-loading structural branches via relational joins."""
        logger.info(f"Querying database templates for group_id: {group_id}")
        return db.query(WorkoutTemplate).options(
            joinedload(WorkoutTemplate.template_exercises).joinedload(TemplateExercise.parameter_values),
            joinedload(WorkoutTemplate.assignments),
            joinedload(WorkoutTemplate.schedules)
        ).filter(WorkoutTemplate.group_id == group_id).all()

    @staticmethod
    def create_template(db: Session, group_id: uuid.UUID, data: dict) -> WorkoutTemplate:
        """Atomically handles core records extraction and maps arrays out into normalized relations."""
        logger.info(f"Spawning normalized workout template entity framework: '{data['name']}'")

        # 1. Store global wrapper metadata
        template = WorkoutTemplate(
            group_id=group_id,
            name=data["name"],
            description=data.get("description"),
            expected_duration_time=data.get("expected_duration_time"),
            scheduled_hour=data.get("scheduled_hour")
        )
        db.add(template)
        db.flush()

        # 2. Extract and link structured exercises and parameter sets flatly
        for ex_data in data.get("exercises", []):
            tm_ex = TemplateExercise(
                template_id=template.id,
                exercise_id=ex_data["exercise_id"],
                num_of_sets=ex_data["num_of_sets"]
            )
            db.add(tm_ex)
            db.flush()

            for param in ex_data.get("params", []):
                param_node = TemplateExerciseParameter(
                    template_exercise_id=tm_ex.id,
                    parameter_id=param["parameter_id"],
                    target_value=param["target_value"]
                )
                db.add(param_node)

        # 3. Map assignment links relationally
        for user_id in data.get("for_users", []):
            db.add(TemplateUserAssignment(template_id=template.id, user_id=user_id))

        # 4. Map schedule lookup flags relationally
        for day in data.get("scheduled_days", []):
            db.add(TemplateScheduleDay(template_id=template.id, day_of_week=day))

        db.commit()
        db.refresh(template)
        return template

    @staticmethod
    def delete_template(db: Session, template_id: int, group_id: uuid.UUID) -> bool:
        """Flushes a template instance using automated cascade definitions."""
        template = db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            WorkoutTemplate.group_id == group_id
        ).first()

        if not template:
            logger.warning(f"Template erase rejected: Token id {template_id} invalid or out-of-bounds.")
            return False

        db.delete(template)
        db.commit()
        logger.info(f"Workout template layout {template_id} completely dropped from database schemas.")
        return True