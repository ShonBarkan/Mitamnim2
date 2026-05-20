from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from core.logger import logger

from .models import ExerciseOut, ExerciseCreate
from .service import ExerciseService

# --- Router Setup ---
router = APIRouter(prefix="/exercises", tags=["Group Isolated Exercises Management"])


@router.get("", response_model=List[ExerciseOut])
async def list_group_exercises(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves all athletic exercises registered within the current group partition."""
    logger.info(f"User '{current_user.username}' requesting exercises list for group_id: {current_user.group_id}")
    service = ExerciseService(db)
    return service.get_group_exercises(current_user.group_id)


# Bulk ingestion endpoint MUST be defined before /{exercise_id} to avoid routing collisions
@router.post("/bulk", response_model=List[ExerciseOut], status_code=status.HTTP_201_CREATED)
async def create_exercises_bulk(
        exercises_data: List[ExerciseCreate],
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Bulk imports a list of exercises using AI-generated data."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    service = ExerciseService(db)
    return service.create_exercises_bulk(exercises_data, current_user.group_id)


@router.post("", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
async def create_new_exercise(
        exercise_data: ExerciseCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Creates a new exercise and auto-syncs virtual parameters."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    service = ExerciseService(db)
    return service.create_exercise(exercise_data, current_user.group_id)


@router.put("/{exercise_id}", response_model=ExerciseOut)
async def update_exercise(
        exercise_id: int,
        exercise_data: ExerciseCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates an existing exercise and re-syncs all relational maps."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    service = ExerciseService(db)
    db_exercise = service.get_exercise_by_id(exercise_id, current_user.group_id)

    if not db_exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found.")

    return service.update_exercise(db_exercise, exercise_data, current_user.group_id)


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Permanently purges an exercise record and its associated relationship maps."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    service = ExerciseService(db)
    db_exercise = service.get_exercise_by_id(exercise_id, current_user.group_id)

    if not db_exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found.")

    service.delete_exercise(db_exercise)