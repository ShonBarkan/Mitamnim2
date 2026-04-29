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
    """Output schema for exercises including UI-specific metadata."""
    id: int
    group_id: uuid.UUID
    has_children: bool = False
    has_params: bool = False

    model_config = ConfigDict(from_attributes=True)


# --- ExerciseService (Business Logic Class) ---

class ExerciseService:
    """
    Service class handling the hierarchical logic of the exercise tree.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_group_exercises(self, group_id: uuid.UUID) -> List[ExerciseOut]:
        """
        Retrieves all exercises for a group and calculates child/param metadata.
        """
        from domains.active_params import ActiveParam

        exercises = self.db.query(ExerciseTree).filter(
            ExerciseTree.group_id == group_id
        ).all()

        results = []
        for ex in exercises:
            # Metadata: Check for children nodes
            child_exists = self.db.query(ExerciseTree).filter(
                ExerciseTree.parent_id == ex.id
            ).first() is not None

            # Metadata: Check for linked active parameters
            params_exist = self.db.query(ActiveParam).filter(
                ActiveParam.exercise_id == ex.id
            ).first() is not None

            ex_out = ExerciseOut.model_validate(ex)
            ex_out.has_children = child_exists
            ex_out.has_params = params_exist
            results.append(ex_out)

        return results

    def create_exercise(self, data: ExerciseCreate, current_group_id: uuid.UUID) -> ExerciseTree:
        """
        Creates a new exercise node.
        Enforces rule: Nodes with measurement parameters cannot become parents.
        """
        from domains.active_params import ActiveParam

        if data.parent_id:
            parent_has_params = self.db.query(ActiveParam).filter(
                ActiveParam.exercise_id == data.parent_id
            ).first()

            if parent_has_params:
                raise ValueError("Cannot add sub-exercises to a node that has measurement parameters.")

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
        """Updates exercise content if group ownership matches."""
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
        """Deletes an exercise and its children via cascading."""
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
        """Fetches joined parameter and link data using raw SQL."""
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
    """Fetches the hierarchical list for the user's group."""
    service = ExerciseService(db)
    return service.get_group_exercises(current_user.group_id)


@router.post("/", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
async def create_exercise(
        exercise_data: ExerciseCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Registers a new exercise node (Trainers/Admins only)."""
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
    """Updates exercise details (Trainers/Admins only)."""
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
    """Removes an exercise and all its descendants (Trainers/Admins only)."""
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
    """Retrieves all parameters linked to a specific exercise node."""
    service = ExerciseService(db)
    try:
        results = service.get_active_params_raw(exercise_id)
        return list(results)
    except Exception:
        raise HTTPException(status_code=500, detail="Error fetching parameters")