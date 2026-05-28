import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from db.database import get_db
from middlewares.auth import get_current_user
from domains.users.models import User
from .service import StatisticsService
from .models import DashboardStatsOut, TrainerGroupStatsOut, AthleteStatsOut

router = APIRouter(prefix="/statistics", tags=["Statistics & Analytics"])


@router.get("/dashboard", response_model=DashboardStatsOut)
async def get_dashboard_statistics(
        start_date: datetime = Query(..., description="Start boundary for the leaderboard"),
        end_date: datetime = Query(..., description="End boundary for the leaderboard"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date cannot be after end_date.")

    service = StatisticsService(db)
    return service.get_dashboard_stats(current_user.group_id, start_date, end_date)


@router.get("/my-stats", response_model=AthleteStatsOut)
async def get_my_statistics(
        start_date: datetime = Query(...),
        end_date: datetime = Query(...),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Athlete endpoint: Returns only the authenticated user's statistics.
    """
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date cannot be after end_date.")

    service = StatisticsService(db)
    return service.get_athlete_statistics(current_user, start_date, end_date)


@router.get("/group-stats", response_model=TrainerGroupStatsOut)
async def get_group_statistics(
        start_date: datetime = Query(...),
        end_date: datetime = Query(...),
        user_ids: Optional[List[uuid.UUID]] = Query(None),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Trainer endpoint: Returns statistics for all or specific users in the group.
    """
    if str(getattr(current_user, 'role', '')).lower() == 'athlete':
        raise HTTPException(status_code=403, detail="Athletes cannot access group statistics.")

    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date cannot be after end_date.")

    # Validate that requested user_ids belong to the trainer's group
    if user_ids:
        valid_count = db.query(User.id) \
            .filter(User.group_id == current_user.group_id) \
            .filter(User.id.in_(user_ids)) \
            .count()
        if valid_count != len(user_ids):
            raise HTTPException(status_code=403, detail="Requested user_ids must belong to your group.")

    service = StatisticsService(db)
    return service.get_group_statistics(current_user, start_date, end_date, user_ids)