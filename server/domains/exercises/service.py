import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from core.logger import logger
from .models import Exercise, ExerciseCreate
from domains.parameters.models import Parameter
from domains.tags.models import Tag


class ExerciseService:
    """
    Service layer executing transaction logic for group-isolated athletic exercises.
    Manages complex relational mappings between exercises, tags, and parameters.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_group_exercises(self, group_id: uuid.UUID) -> List[Exercise]:
        """Retrieves all exercises for a specific group."""
        logger.info(f"Querying exercise catalog for group_id: {group_id}")
        return self.db.query(Exercise).filter(Exercise.group_id == group_id).all()

    def sync_exercise_parameters(self, db_exercise: Exercise, selected_param_ids: List[int], group_id: uuid.UUID):
        """
        Synchronizes parameters: includes selected base parameters AND
        automatically appends virtual parameters if their source requirements are met.
        """
        all_params = self.db.query(Parameter).filter(Parameter.group_id == group_id).all()

        # 1. Identify base parameters selected by user
        selected_params = [p for p in all_params if p.id in selected_param_ids]

        # 2. Automatically append virtual parameters if all their sources are present
        final_params = list(selected_params)
        for p in all_params:
            if p.is_virtual and p.source_parameter_ids:
                if all(sid in selected_param_ids for sid in p.source_parameter_ids):
                    if p not in final_params:
                        final_params.append(p)

        db_exercise.parameters = final_params

    def create_exercise(self, data: ExerciseCreate, group_id: uuid.UUID) -> Exercise:
        """Persists a new exercise and establishes relational map entries for tags and parameters."""
        logger.info(f"Creating individual exercise: '{data.name}' for group: {group_id}")

        new_exercise = Exercise(
            name=data.name.strip(),
            group_id=group_id
        )

        # Sync parameters
        if data.parameter_ids:
            self.sync_exercise_parameters(new_exercise, data.parameter_ids, group_id)

        # Sync tags
        if data.tag_ids:
            new_exercise.tags = self.db.query(Tag).filter(
                Tag.id.in_(data.tag_ids),
                Tag.group_id == group_id
            ).all()

        self.db.add(new_exercise)
        self.db.commit()
        self.db.refresh(new_exercise)

        logger.info(f"Exercise '{new_exercise.name}' created with ID: {new_exercise.id}")
        return new_exercise

    def create_exercises_bulk(self, exercises_data: List[ExerciseCreate], group_id: uuid.UUID) -> List[Exercise]:
        """Iteratively persists a bulk list of exercises with transactional safety."""
        logger.info(f"Initiating bulk ingestion of {len(exercises_data)} exercises for group: {group_id}")

        created_exercises = []
        try:
            for data in exercises_data:
                # Reuse individual creation logic
                new_ex = self.create_exercise(data, group_id)
                created_exercises.append(new_ex)

            logger.info(f"Successfully committed {len(created_exercises)} exercises in bulk operation.")
            return created_exercises
        except Exception as e:
            self.db.rollback()
            logger.error(f"Bulk ingestion failed: {str(e)}")
            raise e

    def update_exercise(self, db_exercise: Exercise, data: ExerciseCreate, group_id: uuid.UUID) -> Exercise:
        """Updates exercise basic info and re-syncs relational maps."""
        logger.info(f"Updating exercise ID: #{db_exercise.id}")

        db_exercise.name = data.name.strip()
        self.sync_exercise_parameters(db_exercise, data.parameter_ids, group_id)
        db_exercise.tags = self.db.query(Tag).filter(Tag.id.in_(data.tag_ids)).all()

        self.db.commit()
        self.db.refresh(db_exercise)
        logger.info(f"Exercise ID: #{db_exercise.id} successfully updated.")
        return db_exercise

    def get_exercise_by_id(self, exercise_id: int, group_id: uuid.UUID) -> Optional[Exercise]:
        """Fetches a specific exercise instance by ID within group isolation bounds."""
        return self.db.query(Exercise).filter(
            Exercise.id == exercise_id,
            Exercise.group_id == group_id
        ).first()

    def delete_exercise(self, db_exercise: Exercise):
        """Purges an exercise record and automatically handles cascading relationship maps."""
        logger.warning(f"Purging exercise record ID: #{db_exercise.id}")
        self.db.delete(db_exercise)
        self.db.commit()