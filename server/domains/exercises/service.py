from typing import List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from .models import ExerciseTree, ExerciseCreate, ExerciseUpdate, ExerciseOut, ExerciseBatchRequest
from ..active_params.models import ActiveParam


# --- ExerciseService (Business Logic Class) ---

class ExerciseService:
    """
    Service class handling the hierarchical logic of the exercise tree.
    """

    def __init__(self, db: Session):
        self.db = db

    def _get_all_descendant_ids(self, exercise_id: int) -> List[int]:
        """Recursive helper to find all descendant IDs for a given node."""
        descendants = [exercise_id]
        children = self.db.query(ExerciseTree.id).filter(ExerciseTree.parent_id == exercise_id).all()
        for child in children:
            descendants.extend(self._get_all_descendant_ids(child.id))
        return descendants

    def _get_recursive_params(self, exercise_id: int) -> List[int]:
        """Fetches all parameter_ids for a node and its entire subtree."""
        all_node_ids = self._get_all_descendant_ids(exercise_id)

        params = self.db.query(ActiveParam.parameter_id).filter(
            ActiveParam.exercise_id.in_(all_node_ids)
        ).all()

        # Returns a unique list of parameter IDs
        return list(set(p.parameter_id for p in params))

    def get_group_exercises(self, group_id) -> List[ExerciseOut]:
        """
        Retrieves all exercises for a group and calculates child/param metadata.
        """
        exercises = self.db.query(ExerciseTree).filter(
            ExerciseTree.group_id == group_id
        ).all()

        results = []
        for ex in exercises:
            # Metadata: Check for direct children
            child_exists = self.db.query(ExerciseTree).filter(
                ExerciseTree.parent_id == ex.id
            ).first() is not None

            # Recursive parameter discovery
            recursive_param_ids = self._get_recursive_params(ex.id)

            ex_out = ExerciseOut.model_validate(ex)
            ex_out.has_children = child_exists
            ex_out.has_params = len(recursive_param_ids) > 0
            ex_out.active_parameter_ids = recursive_param_ids
            results.append(ex_out)

        return results

    def get_exercises_by_ids(self, exercise_ids: List[int], group_id) -> List[ExerciseOut]:
        """
        Retrieves specific exercises by IDs while ensuring group ownership.
        """
        exercises = self.db.query(ExerciseTree).filter(
            ExerciseTree.id.in_(exercise_ids),
            ExerciseTree.group_id == group_id
        ).all()

        results = []
        for ex in exercises:
            child_exists = self.db.query(ExerciseTree).filter(
                ExerciseTree.parent_id == ex.id
            ).first() is not None

            recursive_param_ids = self._get_recursive_params(ex.id)

            ex_out = ExerciseOut.model_validate(ex)
            ex_out.has_children = child_exists
            ex_out.has_params = len(recursive_param_ids) > 0
            ex_out.active_parameter_ids = recursive_param_ids
            results.append(ex_out)

        return results

    def create_exercise(self, data: ExerciseCreate, current_group_id) -> ExerciseTree:
        """
        Creates a new exercise node.
        Ensures nodes with measurement parameters cannot become parents.
        """

        if data.parent_id:
            parent_has_params = self.db.query(ActiveParam).filter(
                ActiveParam.exercise_id == data.parent_id
            ).first()

            if parent_has_params:
                raise ValueError("Cannot add sub-exercises to a node that already has parameters.")

        new_node = ExerciseTree(
            name=data.name,
            parent_id=data.parent_id,
            group_id=current_group_id
        )
        self.db.add(new_node)
        self.db.commit()
        self.db.refresh(new_node)
        return new_node

    def update_exercise(self, exercise_id: int, group_id, update_data: dict) -> ExerciseTree:
        """Updates exercise content if group ownership is verified."""
        db_node = self.db.query(ExerciseTree).filter(
            ExerciseTree.id == exercise_id,
            ExerciseTree.group_id == group_id
        ).first()

        if not db_node:
            return None

        for key, value in update_data.items():
            if hasattr(db_node, key):
                setattr(db_node, key, value)

        self.db.commit()
        self.db.refresh(db_node)
        return db_node

    def delete_exercise(self, exercise_id: int, group_id) -> bool:
        """Deletes an exercise and cascades deletion to descendants."""
        db_node = self.db.query(ExerciseTree).filter(
            ExerciseTree.id == exercise_id,
            ExerciseTree.group_id == group_id
        ).first()

        if not db_node:
            return False

        self.db.delete(db_node)
        self.db.commit()
        return True

    def get_active_params_raw(self, exercise_id: int):
        """Fetches joined parameter and mapping data using optimized raw SQL."""
        query = text("""
            SELECT 
                p.id as parameter_id,
                p.name as parameter_name,
                p.unit as parameter_unit,
                ap.id as id,
                ap.default_value
            FROM parameters p
            JOIN active_params ap ON p.id = ap.parameter_id
            WHERE ap.exercise_id = :ex_id
        """)

        return self.db.execute(query, {"ex_id": exercise_id}).mappings().all()
