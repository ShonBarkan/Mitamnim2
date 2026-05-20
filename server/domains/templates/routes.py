from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from core.logger import logger

from .models import WorkoutTemplateOut, WorkoutTemplateCreate
from .service import TemplateService

router = APIRouter(prefix="/templates", tags=["Workout Templates Management"])

@router.get("", response_model=List[WorkoutTemplateOut], summary="List all templates")
async def list_group_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all templates available for the user's group partition."""
    logger.info(f"User '{current_user.username}' fetching templates for group: {current_user.group_id}")
    service = TemplateService(db)
    # תיקון: קריאה למתודה הנכונה בשירות
    return service.get_group_templates(current_user.group_id)

@router.post("", response_model=WorkoutTemplateOut, status_code=status.HTTP_201_CREATED, summary="Create new template")
async def create_template(
    template_data: WorkoutTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new workout template with sequence and default parameters."""
    if current_user.role not in ["admin", "trainer"]:
        logger.warning(f"Unauthorized template creation attempt by user: {current_user.id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only trainers can create templates.")

    service = TemplateService(db)
    return service.create_template(template_data, current_user.group_id)

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete template")
async def delete_template(
    template_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently purges a template record and its cascading dependencies."""
    if current_user.role not in ["admin", "trainer"]:
        logger.warning(f"Unauthorized template deletion attempt by user: {current_user.id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    service = TemplateService(db)
    try:
        service.delete_template(template_id, current_user.group_id)
        logger.info(f"Template {template_id} successfully purged by user {current_user.id}")
        return None
    except Exception as e:
        logger.error(f"Error purging template {template_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete template.")