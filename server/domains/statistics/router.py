import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from .service import StatisticsService
from .models import DashboardStatsOut, AthleteStatsOut, GroupStatsOut

router = APIRouter(prefix="/statistics", tags=["Statistics & Analytics"])

@router.get("/dashboard", response_model=DashboardStatsOut)
async def get_dashboard_statistics(
        period: str = Query("today", description="Can be 'today', 'week', 'month'"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Returns aggregated dashboard stats based on the configured DashboardConfigs for the user's group.
    """
    if period not in ['today', 'week', 'month']:
        raise HTTPException(status_code=400, detail="Invalid period.")

    service = StatisticsService(db)
    return service.get_dashboard_stats(current_user.group_id, period)


@router.get("/athlete/{athlete_id}", response_model=AthleteStatsOut)
async def get_athlete_statistics(
        athlete_id: uuid.UUID,
        parameter_name: str = Query(..., description="Parameter to track (e.g. 'Weight', 'Reps')"),
        exercise_id: Optional[int] = Query(None, description="Optional exercise filter"),
        months_back: int = Query(3, description="Months of history to retrieve"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Returns trend data and personal bests for a specific athlete.
    Trainers can query any athlete in their group; athletes can only query themselves.
    """
    if current_user.role == 'athlete' and current_user.id != athlete_id:
        raise HTTPException(status_code=403, detail="Can only view personal statistics.")

    # Note: In a production app, verify the trainer and athlete share the same group_id here.

    service = StatisticsService(db)
    return service.get_athlete_stats(athlete_id, parameter_name, exercise_id, months_back)


@router.get("/group", response_model=GroupStatsOut)
async def get_group_statistics(
        parameter_name: str = Query(..., description="Parameter to track (e.g. 'Weight', 'Reps')"),
        exercise_id: Optional[int] = Query(None, description="Optional exercise filter"),
        months_back: int = Query(3, description="Months of history to retrieve"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Returns aggregated trend data for the entire group (Trainer only).
    """
    if current_user.role not in ['admin', 'trainer']:
        raise HTTPException(status_code=403, detail="Only trainers can view group-wide statistics.")

    service = StatisticsService(db)
    return service.get_group_trends(current_user.group_id, parameter_name, exercise_id, months_back)