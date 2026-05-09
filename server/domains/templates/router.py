from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from middlewares.auth import get_current_user

from .models import WorkoutTemplateOut, WorkoutTemplateCreate, WorkoutTemplateUpdate
from .service import WorkoutTemplateService
from ..users.models import User


# --- Router Setup ---

router = APIRouter(prefix="/workout-templates", tags=["Workout Templates"])


@router.post("", response_model=WorkoutTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
        data: WorkoutTemplateCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    service = WorkoutTemplateService(db)
    return service.create_template(current_user, data)


@router.get("", response_model=List[WorkoutTemplateOut])
async def list_templates(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = WorkoutTemplateService(db)
    return service.get_group_templates(current_user)


@router.patch("/{template_id}", response_model=WorkoutTemplateOut)
async def update_template(
        template_id: int,
        data: WorkoutTemplateUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    service = WorkoutTemplateService(db)
    updated = service.update_template(template_id, current_user, data)

    if not updated:
        raise HTTPException(status_code=404, detail="Template not found")
    return updated


@router.delete("/{template_id}")
async def remove_template(
        template_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    service = WorkoutTemplateService(db)
    if not service.delete_template(template_id, current_user):
        raise HTTPException(status_code=404, detail="Template not found")

    return {"detail": "Template deleted successfully"}
