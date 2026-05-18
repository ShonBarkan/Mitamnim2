import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from domains.parameters.models import Parameter
from .models import GroupExerciseRegistry
from core.logger import logger


class ExerciseService:
    """
    Service layer providing an interface for Exercise-related database operations.
    Enforces multi-tenancy group boundaries and dynamic secondary relation mapping.
    """

    @staticmethod
    def get_group_exercises(db: Session, group_id: uuid.UUID) -> List[GroupExerciseRegistry]:
        """Retrieves all exercises for a group preloading parameters relationship mapping via join."""
        return db.query(GroupExerciseRegistry).options(
            joinedload(GroupExerciseRegistry.parameters)
        ).filter(GroupExerciseRegistry.group_id == group_id).all()

    @staticmethod
    def get_exercise_by_id_and_group(db: Session, exercise_id: int, group_id: uuid.UUID) -> Optional[
        GroupExerciseRegistry]:
        """Retrieves a single exercise by ID and group validating access boundaries context."""
        return db.query(GroupExerciseRegistry).options(
            joinedload(GroupExerciseRegistry.parameters)
        ).filter(
            GroupExerciseRegistry.id == exercise_id,
            GroupExerciseRegistry.group_id == group_id
        ).first()

    @staticmethod
    def get_exercises_by_ids(db: Session, exercise_ids: List[int], group_id: uuid.UUID) -> List[GroupExerciseRegistry]:
        """Retrieves multiple exercises by IDs with group verification context tracking."""
        return db.query(GroupExerciseRegistry).options(
            joinedload(GroupExerciseRegistry.parameters)
        ).filter(
            GroupExerciseRegistry.id.in_(exercise_ids),
            GroupExerciseRegistry.group_id == group_id
        ).all()

    @staticmethod
    def create_group_exercise(db: Session, group_id: uuid.UUID, data: dict) -> GroupExerciseRegistry:
        """Creates a new exercise and links parameters directly via the secondary join table matrix."""
        logger.info(f"Registering a new exercise signature named: '{data['name']}' for group: {group_id}")

        existing = db.query(GroupExerciseRegistry).filter(
            GroupExerciseRegistry.group_id == group_id,
            GroupExerciseRegistry.name == data["name"]
        ).first()

        if existing:
            raise ValueError("Exercise name already exists within this group context pool.")

        active_param_ids = data.get("active_parameter_ids", [])
        valid_params = db.query(Parameter).filter(
            Parameter.id.in_(active_param_ids),
            Parameter.group_id == group_id
        ).all()

        new_exercise = GroupExerciseRegistry(
            group_id=group_id,
            name=data["name"],
            category=data.get("category", "General"),
            parameters=valid_params
        )

        db.add(new_exercise)
        db.commit()
        db.refresh(new_exercise)
        return new_exercise

    @staticmethod
    def update_group_exercise(db: Session, exercise_id: int, group_id: uuid.UUID, data: dict) -> Optional[
        GroupExerciseRegistry]:
        """Updates attributes and parameter mapping configuration for an existing exercise node."""
        logger.info(f"Modifying parameters blueprint for exercise id: {exercise_id} inside group: {group_id}")

        exercise = db.query(GroupExerciseRegistry).filter(
            GroupExerciseRegistry.id == exercise_id,
            GroupExerciseRegistry.group_id == group_id
        ).first()

        if not exercise:
            return None

        if "name" in data:
            exercise.name = data["name"]
        if "category" in data:
            exercise.category = data["category"]

        if "active_parameter_ids" in data:
            active_param_ids = data["active_parameter_ids"]
            valid_params = db.query(Parameter).filter(
                Parameter.id.in_(active_param_ids),
                Parameter.group_id == group_id
            ).all()
            exercise.parameters = valid_params

        db.commit()
        db.refresh(exercise)
        return exercise

    @staticmethod
    def delete_exercise(db: Session, exercise_id: int, group_id: uuid.UUID) -> bool:
        """Safely drops an exercise registry target enforcing multi-tenancy verification bounds."""
        exercise = db.query(GroupExerciseRegistry).filter(
            GroupExerciseRegistry.id == exercise_id,
            GroupExerciseRegistry.group_id == group_id
        ).first()

        if not exercise:
            logger.warning(f"Exercise deletion rejected: Node {exercise_id} missing or boundary violation.")
            return False

        db.delete(exercise)
        db.commit()
        logger.info(f"Exercise registry record id: {exercise_id} dropped cleanly from schemas.")
        return True