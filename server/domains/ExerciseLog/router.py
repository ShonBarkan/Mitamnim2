from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from core.logger import logger
from .service import ExerciseLogService
from .models import ExerciseLogCreate, ExerciseLogUpdate, ExerciseLogOut

router = APIRouter(prefix="/exercise-logs", tags=["Exercise Logs"])


@router.post("", response_model=ExerciseLogOut, status_code=status.HTTP_201_CREATED)
async def create_log(
        data: ExerciseLogCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Creates a new exercise log instance."""
    service = ExerciseLogService(db)
    return service.create_log(data.model_dump())


@router.get("/session/{session_id}", response_model=List[ExerciseLogOut])
async def get_logs_by_session(
        session_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all logs bounded to a specific session."""
    service = ExerciseLogService(db)
    return service.get_session_logs(session_id)


@router.get("/user/{user_id}", response_model=List[ExerciseLogOut])
async def get_logs_by_user(
        user_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Retrieves all logs for a specific user.
    Enforces role-based access control.
    """
    if current_user.role != "trainer" and current_user.id != user_id:
        logger.warning(f"Security event: User {current_user.id} attempted to access logs of {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these logs."
        )

    service = ExerciseLogService(db)
    return service.get_user_logs(user_id)


@router.patch("/{log_id}", response_model=ExerciseLogOut)
async def update_log(
        log_id: uuid.UUID,
        data: ExerciseLogUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates an existing exercise log, including its timestamp and parameters."""
    service = ExerciseLogService(db)
    # Using model_dump to convert the Pydantic model to a dictionary
    # exclude_unset=True ensures we only update fields that were actually changed in the UI
    update_data = data.model_dump(exclude_unset=True)

    updated = service.update_log(log_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    return updated


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log(
        log_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Permanently purges an exercise log and its associated snapshots."""
    service = ExerciseLogService(db)
    if not service.delete_log(log_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    return None