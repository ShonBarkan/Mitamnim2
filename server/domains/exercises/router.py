from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from middlewares.auth import get_current_user

from .models import ExerciseOut, ExerciseCreate, ExerciseUpdate, ExerciseBatchRequest
from .service import ExerciseService
from ..users.models import User


# --- Router Setup ---

router = APIRouter(prefix="/exercises", tags=["Exercise Tree"])


@router.get("/", response_model=List[ExerciseOut])
async def get_exercises(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves the full group hierarchy."""
    service = ExerciseService(db)
    return service.get_group_exercises(current_user.group_id)


@router.post("/batch", response_model=List[ExerciseOut])
async def get_exercises_batch(
        batch_data: ExerciseBatchRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves multiple exercises by IDs with group validation."""
    service = ExerciseService(db)
    return service.get_exercises_by_ids(batch_data.exercise_ids, current_user.group_id)


@router.post("/", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
async def create_exercise(
        exercise_data: ExerciseCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Creates a new exercise node (Admins/Trainers only)."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ExerciseService(db)
    try:
        return service.create_exercise(exercise_data, current_user.group_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{exercise_id}", response_model=ExerciseOut)
async def update_exercise(
        exercise_id: int,
        exercise_update: ExerciseUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates exercise details (Admins/Trainers only)."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ExerciseService(db)
    update_data = exercise_update.model_dump(exclude_unset=True)
    updated_node = service.update_exercise(exercise_id, current_user.group_id, update_data)

    if not updated_node:
        raise HTTPException(status_code=404, detail="Exercise not found or access denied")

    return updated_node


@router.delete("/{exercise_id}")
async def delete_exercise(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Removes an exercise and all its descendants (Admins/Trainers only)."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ExerciseService(db)
    if not service.delete_exercise(exercise_id, current_user.group_id):
        raise HTTPException(status_code=404, detail="Exercise not found or access denied")

    return {"message": "Exercise deleted successfully"}


@router.get("/{exercise_id}/active-params")
async def get_exercise_active_params(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches all parameters directly linked to a specific exercise node."""
    service = ExerciseService(db)
    try:
        results = service.get_active_params_raw(exercise_id)
        return list(results)
    except Exception:
        raise HTTPException(status_code=500, detail="Error fetching parameters")
