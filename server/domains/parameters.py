import uuid
from typing import List, Optional

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and security imports
from db.database import Base, get_db
from middlewares.auth import get_current_user
from domains.users import User


# --- Database Model ---

class Parameter(Base):
    """
    SQLAlchemy model representing a measurement parameter (e.g., Weight, Reps, Time).
    Aggregation strategy determines how statistics are calculated (sum, max, min, avg, latest).
    """
    __tablename__ = "parameters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)

    # New column for aggregation logic
    # Options: 'sum', 'max', 'min', 'avg', 'latest'
    aggregation_strategy = Column(String, default="sum", nullable=False)


# --- Pydantic Schemas ---

class ParameterBase(BaseModel):
    """Base schema for parameter data."""
    name: str
    unit: str
    aggregation_strategy: str = "sum"


class ParameterCreate(ParameterBase):
    """Schema for creating a new parameter."""
    pass


class ParameterUpdate(BaseModel):
    """Schema for partially updating an existing parameter."""
    name: Optional[str] = None
    unit: Optional[str] = None
    aggregation_strategy: Optional[str] = None


class ParameterOut(ParameterBase):
    """Schema for outgoing parameter data."""
    id: int
    group_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


# --- ParameterService (Business Logic Class) ---

class ParameterService:
    """
    Service layer to handle business logic for measurement parameters.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_group_parameters(self, group_id: uuid.UUID) -> List[Parameter]:
        """Retrieves all parameters belonging to a specific group."""
        return self.db.query(Parameter).filter(Parameter.group_id == group_id).all()

    def get_parameter_by_id(self, param_id: int, group_id: uuid.UUID) -> Optional[Parameter]:
        """Retrieves a single parameter by ID while verifying group ownership."""
        return self.db.query(Parameter).filter(
            Parameter.id == param_id,
            Parameter.group_id == group_id
        ).first()

    def create_parameter(self, data: ParameterCreate, group_id: uuid.UUID) -> Parameter:
        """Initializes and persists a new parameter associated with a group."""
        new_param = Parameter(
            name=data.name,
            unit=data.unit,
            aggregation_strategy=data.aggregation_strategy,
            group_id=group_id
        )
        self.db.add(new_param)
        self.db.commit()
        self.db.refresh(new_param)
        return new_param

    def update_parameter(self, db_param: Parameter, update_data: dict) -> Parameter:
        """Applies updates to a parameter instance."""
        for key, value in update_data.items():
            setattr(db_param, key, value)
        self.db.commit()
        self.db.refresh(db_param)
        return db_param

    def delete_parameter(self, db_param: Parameter):
        """Removes a parameter record from the database."""
        self.db.delete(db_param)
        self.db.commit()


# --- Router Setup ---

router = APIRouter(prefix="/parameters", tags=["Parameters"])


@router.get("/", response_model=List[ParameterOut])
async def list_parameters(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all measurement parameters for the current group."""
    service = ParameterService(db)
    return service.get_group_parameters(current_user.group_id)


@router.post("/", response_model=ParameterOut, status_code=status.HTTP_201_CREATED)
async def create_new_parameter(
        param_data: ParameterCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Defines a new measurement parameter (Trainers/Admins only)."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create parameters"
        )

    service = ParameterService(db)
    return service.create_parameter(param_data, current_user.group_id)


@router.patch("/{param_id}/", response_model=ParameterOut)
async def update_existing_parameter(
        param_id: int,
        param_update: ParameterUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates an existing parameter's details."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ParameterService(db)
    db_param = service.get_parameter_by_id(param_id, current_user.group_id)

    if not db_param:
        raise HTTPException(status_code=404, detail="Parameter not found or access denied")

    update_dict = param_update.model_dump(exclude_unset=True)
    return service.update_parameter(db_param, update_dict)


@router.delete("/{param_id}/")
async def remove_parameter(
        param_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Deletes a parameter definition from the group."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ParameterService(db)
    db_param = service.get_parameter_by_id(param_id, current_user.group_id)

    if not db_param:
        raise HTTPException(status_code=404, detail="Parameter not found or access denied")

    service.delete_parameter(db_param)
    return {"message": "Parameter deleted successfully"}