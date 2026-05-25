from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from core.logger import logger
from .service import ExerciseLogService
# כאן אני מניח שאתה מייבא את הסכמות מה-models או מ-schemas.py
from .models import ExerciseLogCreate, ExerciseLogUpdate, ExerciseLogOut

router = APIRouter(prefix="/exercise-logs", tags=["Exercise Logs"])

@router.post("", response_model=ExerciseLogOut, status_code=status.HTTP_201_CREATED)
async def create_log(
    data: ExerciseLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ExerciseLogService(db)
    # המרת ה-Pydantic ל-Dict כדי להתאים ל-Service
    return service.create_log(data.model_dump())

@router.get("/session/{session_id}", response_model=List[ExerciseLogOut])
async def get_logs_by_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ExerciseLogService(db)
    return service.get_session_logs(session_id)

@router.patch("/{log_id}", response_model=ExerciseLogOut)
async def update_log(
    log_id: uuid.UUID,
    data: ExerciseLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ExerciseLogService(db)
    updated = service.update_log(log_id, data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Log not found")
    return updated

@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log(
    log_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ExerciseLogService(db)
    if not service.delete_log(log_id):
        raise HTTPException(status_code=404, detail="Log not found")
    return None