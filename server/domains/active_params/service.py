from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from .models import ActiveParam, ActiveParamCreate, ActiveParamBatchRequest
from ..parameters.models import Parameter
from ..exercises.models import ExerciseTree


# --- ActiveParamService ---

class ActiveParamService:
    """
    Business logic for exercise-parameter mapping with optimized queries and dependency handling.
    """

    def __init__(self, db: Session):
        self.db = db

    def _enrich_metadata(self, active_param: ActiveParam):
        """Helper to map relationship data to flat output fields."""
        if active_param.parameter:
            active_param.parameter_name = active_param.parameter.name
            active_param.parameter_unit = active_param.parameter.unit
        return active_param

    def get_all_group_params(self, group_id) -> List[ActiveParam]:
        """Retrieves all active parameters for a group."""
        results = (
            self.db.query(ActiveParam)
            .options(joinedload(ActiveParam.parameter))
            .filter(ActiveParam.group_id == group_id)
            .all()
        )
        return [self._enrich_metadata(r) for r in results]

    def get_params_by_exercise(self, exercise_id: int, group_id) -> List[ActiveParam]:
        """Retrieves parameters for a specific exercise node."""
        results = (
            self.db.query(ActiveParam)
            .options(joinedload(ActiveParam.parameter))
            .filter(
                ActiveParam.exercise_id == exercise_id,
                ActiveParam.group_id == group_id
            )
            .all()
        )
        return [self._enrich_metadata(r) for r in results]

    def get_active_params_batch(self, group_id, ids: Optional[List[int]] = None) -> List[ActiveParam]:
        """Retrieves specific active parameters by ID list."""
        query = self.db.query(ActiveParam).options(joinedload(ActiveParam.parameter)).filter(
            ActiveParam.group_id == group_id
        )

        if ids and len(ids) > 0:
            query = query.filter(ActiveParam.id.in_(ids))

        results = query.all()
        return [self._enrich_metadata(r) for r in results]

    def link_parameter(self, data: ActiveParamCreate) -> ActiveParam:
        """Links a parameter to an exercise node. Only leaf nodes are allowed."""
        has_children = self.db.query(ExerciseTree).filter(
            ExerciseTree.parent_id == data.exercise_id
        ).first() is not None

        if has_children:
            raise ValueError("Cannot link parameters to a category node.")

        existing = self.db.query(ActiveParam).filter(
            ActiveParam.exercise_id == data.exercise_id,
            ActiveParam.parameter_id == data.parameter_id
        ).first()

        if existing:
            raise ValueError("This parameter is already linked to this exercise.")

        new_link = ActiveParam(**data.model_dump())
        self.db.add(new_link)
        self.db.commit()
        self.db.refresh(new_link)

        return self.get_params_by_exercise(new_link.exercise_id, new_link.group_id)[-1]

    def unlink_parameter(self, link_id: int, group_id) -> bool:
        """
        Deletes a link and recursively removes any virtual parameters that depend on it.
        """
        db_link = self.db.query(ActiveParam).filter(
            ActiveParam.id == link_id,
            ActiveParam.group_id == group_id
        ).first()

        if not db_link:
            return False

        exercise_id = db_link.exercise_id
        parameter_id = db_link.parameter_id

        # 1. Delete the primary link
        self.db.delete(db_link)
        self.db.flush() # Sync state before checking dependencies

        # 2. Recursive cleanup: Find virtual parameters linked to THIS exercise
        # that use the deleted parameter_id in their source_parameter_ids.
        dependent_active_params = (
            self.db.query(ActiveParam)
            .join(Parameter, ActiveParam.parameter_id == Parameter.id)
            .filter(
                ActiveParam.exercise_id == exercise_id,
                Parameter.is_virtual == True,
                Parameter.source_parameter_ids.any(parameter_id)
            )
            .all()
        )

        for dep in dependent_active_params:
            # Recursively call unlink to handle nested dependencies (chains)
            self.unlink_parameter(dep.id, group_id)

        self.db.commit()
        return True
