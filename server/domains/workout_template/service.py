import uuid
from typing import List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload
from domains.workout_template.models import (
    WorkoutTemplate, TemplateExercise, TemplateExerciseParameter,
    TemplateScheduleDay
)
from domains.exercises.models import GroupExerciseRegistry
from core.logger import logger


class TemplateService:
    @staticmethod
    def get_group_templates(db: Session, group_id: uuid.UUID) -> List[WorkoutTemplate]:
        """Retrieves templates for a group pre-loading structural branches via relational joins."""
        logger.info(f"Querying database templates for group_id: {group_id}")
        return db.query(WorkoutTemplate).options(
            joinedload(WorkoutTemplate.template_exercises).joinedload(TemplateExercise.parameter_values),
            joinedload(WorkoutTemplate.schedules)
        ).filter(WorkoutTemplate.group_id == group_id).all()

    @staticmethod
    def create_template(db: Session, group_id: uuid.UUID, data: dict) -> WorkoutTemplate:
        """Atomically handles core records extraction and maps arrays out into normalized relations."""
        logger.info(f"Spawning normalized workout template entity framework: '{data['name']}'")

        # 1. Store global wrapper metadata matching physical text column definitions
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
            resolved_exercise_id = ex_data.get("exercise_id")

            # Inline Auto-Creation Logic: Matches physical 'name' column of group_exercise_registry
            if not resolved_exercise_id and ex_data.get("exercise_name"):
                name_clean = ex_data["exercise_name"].strip()
                logger.info(f"Custom exercise token matching issued for physical label: '{name_clean}'")

                existing_exercise = db.query(GroupExerciseRegistry).filter(
                    GroupExerciseRegistry.name == name_clean
                ).first()

                if existing_exercise:
                    resolved_exercise_id = existing_exercise.id
                else:
                    logger.info(f"Persisting missing custom exercise registry entity asset node: '{name_clean}'")

                    # Create new base exercise entity mapping to physical columns
                    new_registry_exercise = GroupExerciseRegistry(
                        name=name_clean,
                        category="כללי",
                        group_id=group_id
                    )
                    db.add(new_registry_exercise)
                    db.flush()
                    resolved_exercise_id = new_registry_exercise.id

                    # Link assigned base tracking metrics to the physical 'exercise_parameters' connection table
                    for param in ex_data.get("params", []):
                        db.execute(
                            text("""
                                INSERT INTO exercise_parameters (exercise_id, parameter_id)
                                VALUES (:ex_id, :param_id)
                                ON CONFLICT DO NOTHING
                            """),
                            {"ex_id": resolved_exercise_id, "param_id": int(param["parameter_id"])}
                        )

            if not resolved_exercise_id:
                logger.error("Skipping structural compilation step for exercise row node: missing identity parameters.")
                continue

            tm_ex = TemplateExercise(
                template_id=template.id,
                exercise_id=resolved_exercise_id,
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

        # 3. Map assignment links relationally into physical 'template_user_assignments' intersection table
        for user_id in data.get("for_users", []):
            db.execute(
                text("""
                    INSERT INTO template_user_assignments (template_id, user_id)
                    VALUES (:template_id, :user_id)
                    ON CONFLICT DO NOTHING
                """),
                {"template_id": template.id, "user_id": str(user_id)}
            )

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