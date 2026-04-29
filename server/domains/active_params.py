import uuid
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Session, joinedload
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and security imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User
from domains.parameters import Parameter
from domains.exercises import ExerciseTree


# --- Database Model ---

class ActiveParam(Base):
    """
    SQLAlchemy model representing the link between a specific exercise and its parameters.
    """
    __tablename__ = "active_params"

    id = Column(Integer, primary_key=True, index=True)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    default_value = Column(Text, nullable=True)

    # Relationships
    parameter = relationship("Parameter")
    exercise = relationship("ExerciseTree", back_populates="active_params")


# --- Pydantic Schemas ---

class ActiveParamBase(BaseModel):
    """Base schema for active parameter data."""
    parameter_id: int
    exercise_id: int
    group_id: uuid.UUID
    default_value: Optional[str] = None


class ActiveParamCreate(ActiveParamBase):
    """Schema for creating a new link."""
    pass


class ActiveParamOut(ActiveParamBase):
    """Output schema enriched with metadata for the UI."""
    id: int
    parameter_name: Optional[str] = None
    parameter_unit: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- ActiveParamService ---

class ActiveParamService:
    """
    Business logic for exercise-parameter mapping.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_params_by_exercise(self, exercise_id: int, group_id: uuid.UUID) -> List[ActiveParam]:
        """
        Retrieves parameters for an exercise and uses joinedload to fetch
        parameter metadata (name, unit) in a single query.
        """
        results = (
            self.db.query(ActiveParam)
            .options(joinedload(ActiveParam.parameter))
            .filter(
                ActiveParam.exercise_id == exercise_id,
                ActiveParam.group_id == group_id
            )
            .all()
        )

        # Enrich results for the Pydantic response model
        for r in results:
            r.parameter_name = r.parameter.name
            r.parameter_unit = r.parameter.unit

        return results

    def link_parameter(self, data: ActiveParamCreate) -> ActiveParam:
        """
        Links a parameter to an exercise. Enforces the rule that parameters
        can only be linked to 'leaf' exercises (no children).
        """
        # Business Rule: Cannot link params to categories
        has_children = self.db.query(ExerciseTree).filter(
            ExerciseTree.parent_id == data.exercise_id
        ).first() is not None

        if has_children:
            raise ValueError("Cannot link parameters to a category exercise.")

        # Check for existing link to prevent duplicates
        existing = self.db.query(ActiveParam).filter(
            ActiveParam.exercise_id == data.exercise_id,
            ActiveParam.parameter_id == data.parameter_id,
            ActiveParam.group_id == data.group_id
        ).first()

        if existing:
            raise ValueError("This parameter is already linked to this exercise.")

        new_link = ActiveParam(**data.model_dump())
        self.db.add(new_link)
        self.db.commit()
        self.db.refresh(new_link)

        # Populate metadata from the relationship for immediate UI update
        new_link.parameter_name = new_link.parameter.name
        new_link.parameter_unit = new_link.parameter.unit

        return new_link

    def unlink_parameter(self, link_id: int, group_id: uuid.UUID) -> bool:
        """Removes a link after ownership check."""
        db_link = self.db.query(ActiveParam).filter(
            ActiveParam.id == link_id,
            ActiveParam.group_id == group_id
        ).first()

        if not db_link:
            return False

        self.db.delete(db_link)
        self.db.commit()
        return True


# --- Router Setup ---

router = APIRouter(prefix="/active-params", tags=["Active Parameters"])


@router.get("/{exercise_id}/", response_model=List[ActiveParamOut])
async def get_active_params_for_exercise(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches parameters for a specific exercise."""
    service = ActiveParamService(db)
    return service.get_params_by_exercise(exercise_id, current_user.group_id)


@router.post("/", response_model=ActiveParamOut, status_code=status.HTTP_201_CREATED)
async def link_parameter_to_exercise(
        data: ActiveParamCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Creates a new link (Admins/Trainers only)."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if data.group_id != current_user.group_id:
        raise HTTPException(status_code=403, detail="Group mismatch")

    service = ActiveParamService(db)
    try:
        return service.link_parameter(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{link_id}/")
async def unlink_parameter(
        link_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Removes a link (Admins/Trainers only)."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ActiveParamService(db)
    if not service.unlink_parameter(link_id, current_user.group_id):
        raise HTTPException(status_code=404, detail="Link not found")

    return {"message": "Parameter unlinked successfully"}