import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User

from .models import ParameterOut, ParameterCreate, ParameterUpdate
from .service import ParameterService

# --- Router Setup ---
router = APIRouter(prefix="/parameters", tags=["Parameters"])


@router.get("", response_model=List[ParameterOut])
async def list_parameters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all measurement parameters allocated within the current user's group perimeter."""
    service = ParameterService(db)
    return service.get_group_parameters(current_user.group_id)


@router.post("", response_model=ParameterOut, status_code=status.HTTP_201_CREATED)
async def create_new_parameter(
    param_data: ParameterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Defines a new measurement parameter blueprint. Restricted strictly to admin and trainer roles."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Restricted to structural operational managers."
        )

    service = ParameterService(db)
    return service.create_parameter(param_data, current_user.group_id)


@router.put("/{param_id}", response_model=ParameterOut)
async def update_existing_parameter(
    param_id: int,
    param_update: ParameterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the entire definition framework of a parameter.
    Switched to PUT to ensure atomicity across variant structural formula payload types.
    """
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Restricted to structural operational managers."
        )

    service = ParameterService(db)
    db_param = service.get_parameter_by_id(param_id, current_user.group_id)

    if not db_param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parameter profile missing or access validation context out of bounds."
        )

    update_dict = param_update.model_dump()
    return service.update_parameter(db_param, update_dict)


@router.delete("/{param_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_parameter(
    param_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently purges a parameter definition row from group tracking memory contexts."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Restricted to structural operational managers."
        )

    service = ParameterService(db)
    db_param = service.get_parameter_by_id(param_id, current_user.group_id)

    if not db_param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parameter profile missing or access validation context out of bounds."
        )

    service.delete_parameter(db_param)