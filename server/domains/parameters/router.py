from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from middlewares.auth import get_current_user

from .models import ParameterOut, ParameterCreate, ParameterUpdate
from .service import ParameterService
from ..users.models import User


# --- Router Setup ---

router = APIRouter(prefix="/parameters", tags=["Parameters"])


@router.get("/", response_model=List[ParameterOut])
async def list_parameters(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all measurement parameters for the current user's group."""
    service = ParameterService(db)
    return service.get_group_parameters(current_user.group_id)


@router.post("/", response_model=ParameterOut, status_code=status.HTTP_201_CREATED)
async def create_new_parameter(
        param_data: ParameterCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Defines a new measurement parameter. Restricted to admin and trainer roles."""
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
    """Updates parameter details. Restricted to admin and trainer roles."""
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
    """Deletes a parameter definition. Restricted to admin and trainer roles."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ParameterService(db)
    db_param = service.get_parameter_by_id(param_id, current_user.group_id)

    if not db_param:
        raise HTTPException(status_code=404, detail="Parameter not found or access denied")

    service.delete_parameter(db_param)
    return {"message": "Parameter deleted successfully"}
