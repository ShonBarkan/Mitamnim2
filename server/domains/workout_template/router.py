import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from middlewares.auth import get_current_user
from domains.workout_template.models import WorkoutTemplateCreate, WorkoutTemplateOut
from domains.workout_template.service import TemplateService

router = APIRouter(prefix="/templates", tags=["Workout Templates Blueprint"])


@router.get("", response_model=List[WorkoutTemplateOut])
async def list_templates(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Fetches all recurring template structures allocated within user group parameters."""
    if not current_user.group_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Identity missing valid group context scope assignment.")
    return TemplateService.get_group_templates(db, current_user.group_id)


@router.post("", response_model=WorkoutTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(payload: WorkoutTemplateCreate, db: Session = Depends(get_db),
                          current_user=Depends(get_current_user)):
    """Creates an isolated template instance deploying data down across flat lookup connections."""
    if not current_user.group_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Group boundary profile configuration missing.")
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Access denied: Restricted to structural managers.")

    return TemplateService.create_template(db, current_user.group_id, payload.model_dump())


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Asserts authorization access matrix and completely deletes a workout template target."""
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Insufficient operational permissions profile.")

    success = TemplateService.delete_template(db, template_id, current_user.group_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Template entity mapping target could not be verified.")