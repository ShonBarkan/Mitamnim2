import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from domains.parameters.models import ParameterOut

from .models import ExerciseCreate, ExerciseOut, ExerciseUpdate, ExerciseBatchRequest
from .service import ExerciseService

router = APIRouter(prefix="/exercises", tags=["Exercises Registry Pipeline"])


@router.get("", response_model=List[ExerciseOut])
async def get_exercises(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches all exercise records allocated inside the current authenticated group perimeter."""
    if not current_user.group_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not assigned to a group context.")

    raw_exercises = ExerciseService.get_group_exercises(db, current_user.group_id)

    return [
        ExerciseOut(
            id=ex.id,
            group_id=ex.group_id,
            name=ex.name,
            category=ex.category,
            active_parameter_ids=[p.id for p in ex.parameters]
        )
        for ex in raw_exercises
    ]


@router.post("/batch", response_model=List[ExerciseOut])
async def get_exercises_batch(
        batch_data: ExerciseBatchRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Retrieves multiple exercises by IDs validating group perimeter ownership boundaries."""
    if not current_user.group_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User group scope validation missing.")

    raw_exercises = ExerciseService.get_exercises_by_ids(db, batch_data.exercise_ids, current_user.group_id)

    return [
        ExerciseOut(
            id=ex.id,
            group_id=ex.group_id,
            name=ex.name,
            category=ex.category,
            active_parameter_ids=[p.id for p in ex.parameters]
        )
        for ex in raw_exercises
    ]


@router.post("", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
async def create_exercise(
        payload: ExerciseCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Registers a clean, un-nested flat exercise token configuration inside the user group pool."""
    if not current_user.group_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User group scope validation missing.")
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Access denied: Restricted to trainers or administrators.")

    try:
        created = ExerciseService.create_group_exercise(db, current_user.group_id, payload.model_dump())
        return ExerciseOut(
            id=created.id,
            group_id=created.group_id,
            name=created.name,
            category=created.category,
            active_parameter_ids=[p.id for p in created.parameters]
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{exercise_id}", response_model=ExerciseOut)
async def update_exercise(
        exercise_id: int,
        exercise_update: ExerciseUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Updates exercise structural attributes configuration rules (Admins/Trainers only)."""
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify exercises.")

    update_data = exercise_update.model_dump(exclude_unset=True)
    updated_node = ExerciseService.update_group_exercise(db, exercise_id, current_user.group_id, update_data)

    if not updated_node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found or access denied.")

    return ExerciseOut(
        id=updated_node.id,
        group_id=updated_node.group_id,
        name=updated_node.name,
        category=updated_node.category,
        active_parameter_ids=[p.id for p in updated_node.parameters]
    )


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Triggers secure out-of-bounds validation checks and deletes target exercise entries."""
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Insufficient operational permissions context.")

    success = ExerciseService.delete_exercise(db, exercise_id, current_user.group_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Exercise registry mapping target could not be verified.")


@router.get("/{exercise_id}/active-params", response_model=List[ParameterOut])
async def get_exercise_active_params(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches full parameter models linked to an exercise using optimized database relation preloads."""
    if not current_user.group_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Missing valid group identity context scope.")

    exercise = ExerciseService.get_exercise_by_id_and_group(db, exercise_id, current_user.group_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Exercise registry record not found or access denied.")

    return exercise.parameters