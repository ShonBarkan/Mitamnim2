import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from middlewares.auth import get_current_user
from core.logger import logger

from .models import GroupOut, GroupCreate, GroupUpdate
from .service import GroupService

# --- Router Setup ---
router = APIRouter(prefix="/groups", tags=["Groups"])


@router.post("/", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_new_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Endpoint for creating a new training group.
    Restriction: Only 'admin' users are authorized to create groups.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create groups"
        )

    service = GroupService(db)

    if service.get_group_by_name(group_data.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group name already exists"
        )

    return service.create_group(group_data)


@router.get("/", response_model=List[GroupOut])
async def get_available_groups(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Endpoint to retrieve group lists based on user context.
    - Admins: Retrieve all groups.
    - Others: Retrieve only their assigned group.
    """
    service = GroupService(db)

    if current_user.role == "admin":
        return service.get_all_groups()

    if not current_user.group_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not assigned to any group"
        )

    group = service.get_group_by_id(current_user.group_id)
    return [group] if group else []


@router.patch("/{group_id}", response_model=GroupOut)
async def update_existing_group(
    group_id: uuid.UUID,
    group_update: GroupUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Endpoint to partially update group details.
    Restriction: Authorized for Admins, or Trainers managing their own group context.
    """
    service = GroupService(db)
    db_group = service.get_group_by_id(group_id)

    if not db_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    is_admin = current_user.role == "admin"
    is_assigned_trainer = (current_user.role == "trainer" and current_user.group_id == group_id)

    if not (is_admin or is_assigned_trainer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this group"
        )

    update_dict = group_update.model_dump(exclude_unset=True)
    return service.update_group(db_group, update_dict)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_group(
    group_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Endpoint for permanent group deletion.
    Restriction: Only 'admin' users can perform this action.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete groups"
        )

    service = GroupService(db)
    db_group = service.get_group_by_id(group_id)

    if not db_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    service.delete_group(db_group)