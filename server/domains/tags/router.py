from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from core.logger import logger

from .models import TagOut, TagCreate
from .service import TagService

# --- Router Setup ---
router = APIRouter(prefix="/tags", tags=["Group Isolated Tags Management"])


@router.get("", response_model=List[TagOut])
async def list_group_tags(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all localized metadata tags registered within the current user's group partition perimeter."""
    logger.info(f"User '{current_user.username}' requested tags listing for group_id: {current_user.group_id}")
    service = TagService(db)
    return service.get_group_tags(current_user.group_id)


@router.post("", response_model=TagOut, status_code=status.HTTP_201_CREATED)
async def create_new_group_tag(
        tag_data: TagCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Defines a new group-specific metadata tag. Access restricted to admin and trainer roles."""
    logger.info(
        f"User '{current_user.username}' attempting to build new tag '{tag_data.name}' for group_id: {current_user.group_id}")

    if current_user.role not in ["admin", "trainer"]:
        logger.warning(
            f"Unauthorized tag creation attempt blocked for user '{current_user.username}' with role '{current_user.role}'")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Restricted to structural managers."
        )

    service = TagService(db)
    return service.create_tag(tag_data, current_user.group_id)


@router.post("/bulk", response_model=List[TagOut], status_code=status.HTTP_201_CREATED)
async def create_bulk_group_tags(
        tags_data: List[TagCreate],
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Persists an array matrix of new group-specific metadata tags in a single transaction execution sequence."""
    logger.info(f"User '{current_user.username}' attempting batch write operation for {len(tags_data)} tags on group_id: {current_user.group_id}")

    if current_user.role not in ["admin", "trainer"]:
        logger.warning(f"Unauthorized bulk tag creation block intercepted for user '{current_user.username}'")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Restricted to structural managers."
        )

    service = TagService(db)
    return service.create_bulk_tags(tags_data, current_user.group_id)


@router.put("/{tag_id}", response_model=TagOut)
async def update_existing_group_tag(
        tag_id: int,
        tag_update: TagCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates the definition metrics of an existing tag while validating group ownership perimeters."""
    logger.info(f"User '{current_user.username}' attempting PUT modification on tag ID: #{tag_id}")

    if current_user.role not in ["admin", "trainer"]:
        logger.warning(
            f"Unauthorized tag update attempt blocked for user '{current_user.username}' on tag ID: #{tag_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Restricted to structural managers."
        )

    service = TagService(db)
    db_tag = service.get_tag_by_id(tag_id, current_user.group_id)

    if not db_tag:
        logger.error(
            f"Tag update failure: Tag ID: #{tag_id} does not exist or access denied for group_id: {current_user.group_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target group tag entity framework context could not be verified or access denied."
        )

    update_dict = tag_update.model_dump()
    return service.update_tag(db_tag, update_dict)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_group_tag(
        tag_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Permanently purges a localized group tag from physical database schemas data frameworks."""
    logger.info(f"User '{current_user.username}' attempting deletion of tag ID: #{tag_id}")

    if current_user.role not in ["admin", "trainer"]:
        logger.warning(
            f"Unauthorized tag deletion attempt blocked for user '{current_user.username}' on tag ID: #{tag_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Restricted to structural managers."
        )

    service = TagService(db)
    db_tag = service.get_tag_by_id(tag_id, current_user.group_id)

    if not db_tag:
        logger.error(
            f"Tag destruction failure: Tag ID: #{tag_id} does not exist or access denied for group_id: {current_user.group_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target group tag entity framework context could not be verified or access denied."
        )

    service.delete_tag(db_tag)