from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from middlewares.auth import get_current_user

from .models import ActiveParamOut, ActiveParamCreate, ActiveParamBatchRequest
from .service import ActiveParamService
from ..users.models import User


# --- Router Setup ---

router = APIRouter(prefix="/active-params", tags=["Active Parameters"])


@router.get("/", response_model=List[ActiveParamOut])
async def get_all_group_active_params(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = ActiveParamService(db)
    return service.get_all_group_params(current_user.group_id)


@router.get("/exercise/{exercise_id}/", response_model=List[ActiveParamOut])
async def get_active_params_for_exercise(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = ActiveParamService(db)
    return service.get_params_by_exercise(exercise_id, current_user.group_id)


@router.post("/batch/", response_model=List[ActiveParamOut])
async def get_active_params_batch(
        request: ActiveParamBatchRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = ActiveParamService(db)
    return service.get_active_params_batch(current_user.group_id, request.ids)


@router.post("/", response_model=ActiveParamOut, status_code=status.HTTP_201_CREATED)
async def link_parameter_to_exercise(
        data: ActiveParamCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if data.group_id != current_user.group_id:
        raise HTTPException(status_code=403, detail="Group mismatch")

    service = ActiveParamService(db)
    try:
        return service.link_parameter(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{link_id}/")
async def unlink_parameter(
        link_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    service = ActiveParamService(db)
    if not service.unlink_parameter(link_id, current_user.group_id):
        raise HTTPException(status_code=404, detail="Link not found")

    return {"message": "Parameter unlinked successfully"}
