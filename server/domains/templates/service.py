import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from core.logger import logger
from domains.tags.models import Tag
from .models import WorkoutTemplate, TemplateExercise, TemplateExerciseParam, \
    TemplateUserAssignment, WorkoutTemplateCreate


class TemplateService:
    """
    Service layer for managing workout templates, relational associations,
    user-specific assignments, and tag mappings.
    Incorporates eager loading to resolve N+1 queries and provide enriched data.
    """

    def __init__(self, db: Session):
        self.db = db

    def create_template(self, data: WorkoutTemplateCreate, group_id: uuid.UUID) -> WorkoutTemplate:
        logger.info(f"Initiating transactional template creation: '{data.name}' for group: {group_id}")

        try:
            # 1. Create Template base
            new_template = WorkoutTemplate(
                name=data.name,
                description=data.description,
                group_id=group_id,
                estimated_duration=data.estimated_duration
            )
            self.db.add(new_template)
            self.db.flush()  # Flush to generate new_template.id

            # 2. Process Tags
            if data.tag_ids:
                tags = self.db.query(Tag).filter(
                    Tag.id.in_(data.tag_ids),
                    Tag.group_id == group_id
                ).all()
                new_template.tags = tags
                logger.info(f"Associated {len(tags)} tags with template '{new_template.name}'")

            # 3. Process Exercises and their parameters
            for ex_data in data.exercises:
                new_exercise = TemplateExercise(
                    template_id=new_template.id,
                    exercise_id=ex_data.exercise_id,
                    position=ex_data.position,
                    sets=ex_data.sets
                )
                self.db.add(new_exercise)
                self.db.flush()

                for param in ex_data.parameters:
                    new_param = TemplateExerciseParam(
                        template_exercise_id=new_exercise.id,
                        parameter_id=param.parameter_id,
                        default_value=param.default_value
                    )
                    self.db.add(new_param)

            # 4. Assign to users
            for user_id in data.assigned_user_ids:
                assignment = TemplateUserAssignment(
                    template_id=new_template.id,
                    user_id=user_id
                )
                self.db.add(assignment)

            # Commit the transaction to persist all relations
            self.db.commit()
            logger.info(f"Successfully committed template '{new_template.name}' with ID: {new_template.id}")

            # Fetch the fully enriched template to return to the client
            return self._get_enriched_template(new_template.id)

        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create template '{data.name}': {str(e)}")
            raise e

    def get_group_templates(self, group_id: uuid.UUID) -> List[WorkoutTemplate]:
        """
        Retrieves the complete templates catalog for a specific group.
        Uses selectinload to eagerly load all nested relationships and references
        to prevent N+1 query performance bottlenecks.
        """
        logger.info(f"Retrieving enriched templates catalog for group: {group_id}")
        return self.db.query(WorkoutTemplate).filter(
            WorkoutTemplate.group_id == group_id
        ).options(
            selectinload(WorkoutTemplate.tags),
            selectinload(WorkoutTemplate.assigned_users),
            selectinload(WorkoutTemplate.exercises).selectinload(TemplateExercise.exercise_ref),
            selectinload(WorkoutTemplate.exercises).selectinload(TemplateExercise.parameters).selectinload(TemplateExerciseParam.parameter_ref)
        ).all()

    def delete_template(self, template_id: uuid.UUID, group_id: uuid.UUID):
        logger.warning(f"Purging template ID: {template_id} from group: {group_id}")
        template = self.db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            WorkoutTemplate.group_id == group_id
        ).first()

        if template:
            self.db.delete(template)
            self.db.commit()
            logger.info(f"Template ID: {template_id} purged successfully.")
        else:
            logger.warning(f"Template ID: {template_id} not found for deletion.")

    def _get_enriched_template(self, template_id: uuid.UUID) -> WorkoutTemplate:
        """
        Internal helper method to fetch a single template with all its
        enriched relational data loaded.
        """
        return self.db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id
        ).options(
            selectinload(WorkoutTemplate.tags),
            selectinload(WorkoutTemplate.assigned_users),
            selectinload(WorkoutTemplate.exercises).selectinload(TemplateExercise.exercise_ref),
            selectinload(WorkoutTemplate.exercises).selectinload(TemplateExercise.parameters).selectinload(TemplateExerciseParam.parameter_ref)
        ).first()

    def update_template(self, template_id: uuid.UUID, group_id: uuid.UUID, data: WorkoutTemplateCreate) -> Optional[
        WorkoutTemplate]:
        template = self.db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            WorkoutTemplate.group_id == group_id
        ).first()

        if not template:
            return None

        try:
            # 1. עדכון שדות בסיס
            template.name = data.name
            template.description = data.description
            template.estimated_duration = data.estimated_duration

            # 2. עדכון תגיות (ניקוי והוספה מחדש)
            tags = self.db.query(Tag).filter(Tag.id.in_(data.tag_ids), Tag.group_id == group_id).all()
            template.tags = tags

            # 3. עדכון משתמשים משויכים
            self.db.query(TemplateUserAssignment).filter(TemplateUserAssignment.template_id == template_id).delete()
            for user_id in data.assigned_user_ids:
                self.db.add(TemplateUserAssignment(template_id=template_id, user_id=user_id))

            # 4. עדכון תרגילים (ניקוי והוספה מחדש - הדרך הקלה והבטוחה ביותר)
            self.db.query(TemplateExercise).filter(TemplateExercise.template_id == template_id).delete()
            for ex_data in data.exercises:
                new_exercise = TemplateExercise(
                    template_id=template_id,
                    exercise_id=ex_data.exercise_id,
                    position=ex_data.position,
                    sets=ex_data.sets
                )
                self.db.add(new_exercise)
                self.db.flush()
                for param in ex_data.parameters:
                    self.db.add(TemplateExerciseParam(
                        template_exercise_id=new_exercise.id,
                        parameter_id=param.parameter_id,
                        default_value=param.default_value
                    ))

            self.db.commit()
            return self._get_enriched_template(template_id)
        except Exception as e:
            self.db.rollback()
            raise e