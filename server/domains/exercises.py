import uuid
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and core imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User


# --- Database Models ---

class ExerciseTree(Base):
    """
    SQLAlchemy model representing a node in the exercise hierarchy.
    Acts as a self-referencing tree structure.
    """
    __tablename__ = "exercise_tree"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    active_params = relationship("ActiveParam", back_populates="exercise", cascade="all, delete-orphan")


# --- Pydantic Schemas ---

class ExerciseBase(BaseModel):
    """Base schema for Exercise Tree data."""
    name: str
    parent_id: Optional[int] = None


class ExerciseCreate(ExerciseBase):
    """Schema for creating a new exercise node."""
    pass


class ExerciseUpdate(BaseModel):
    """Schema for updating an existing exercise node."""
    name: Optional[str] = None
    parent_id: Optional[int] = None


class ExerciseOut(ExerciseBase):
    """Output schema for exercises including recursive metadata."""
    id: int
    group_id: uuid.UUID
    has_children: bool = False
    has_params: bool = False
    # List of parameter IDs associated with this node and its descendants
    active_parameter_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


class ExerciseBatchRequest(BaseModel):
    """Schema for requesting multiple exercises by their IDs."""
    exercise_ids: List[int]


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
        from domains.active_params import ActiveParam
        all_node_ids = self._get_all_descendant_ids(exercise_id)

        params = self.db.query(ActiveParam.parameter_id).filter(
            ActiveParam.exercise_id.in_(all_node_ids)
        ).all()

        # Returns a unique list of parameter IDs
        return list(set(p.parameter_id for p in params))

    def get_group_exercises(self, group_id: uuid.UUID) -> List[ExerciseOut]:
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

    def get_exercises_by_ids(self, exercise_ids: List[int], group_id: uuid.UUID) -> List[ExerciseOut]:
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

    def create_exercise(self, data: ExerciseCreate, current_group_id: uuid.UUID) -> ExerciseTree:
        """
        Creates a new exercise node.
        Ensures nodes with measurement parameters cannot become parents.
        """
        from domains.active_params import ActiveParam

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

    def update_exercise(self, exercise_id: int, group_id: uuid.UUID, update_data: dict) -> ExerciseTree:
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

    def delete_exercise(self, exercise_id: int, group_id: uuid.UUID) -> bool:
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


# --- Router Setup ---

router = APIRouter(prefix="/exercises", tags=["Exercise Tree"])


@router.get("/", response_model=List[ExerciseOut])
async def get_exercises(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves the full group hierarchy."""
    service = ExerciseService(db)
    return service.get_group_exercises(current_user.group_id)


@router.post("/batch", response_model=List[ExerciseOut])
async def get_exercises_batch(
        batch_data: ExerciseBatchRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves multiple exercises by IDs with group validation."""
    service = ExerciseService(db)
    return service.get_exercises_by_ids(batch_data.exercise_ids, current_user.group_id)


@router.post("/", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
async def create_exercise(
        exercise_data: ExerciseCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Creates a new exercise node (Admins/Trainers only)."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ExerciseService(db)
    try:
        return service.create_exercise(exercise_data, current_user.group_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{exercise_id}", response_model=ExerciseOut)
async def update_exercise(
        exercise_id: int,
        exercise_update: ExerciseUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates exercise details (Admins/Trainers only)."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ExerciseService(db)
    update_data = exercise_update.model_dump(exclude_unset=True)
    updated_node = service.update_exercise(exercise_id, current_user.group_id, update_data)

    if not updated_node:
        raise HTTPException(status_code=404, detail="Exercise not found or access denied")

    return updated_node


@router.delete("/{exercise_id}")
async def delete_exercise(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Removes an exercise and all its descendants (Admins/Trainers only)."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ExerciseService(db)
    if not service.delete_exercise(exercise_id, current_user.group_id):
        raise HTTPException(status_code=404, detail="Exercise not found or access denied")

    return {"message": "Exercise deleted successfully"}


@router.get("/{exercise_id}/active-params")
async def get_exercise_active_params(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches all parameters directly linked to a specific exercise node."""
    service = ExerciseService(db)
    try:
        results = service.get_active_params_raw(exercise_id)
        return list(results)
    except Exception:
        raise HTTPException(status_code=500, detail="Error fetching parameters")