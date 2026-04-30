import uuid
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

from sqlalchemy import and_, func, Integer
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and core imports
from db.database import get_db
from middlewares.auth import get_current_user
from domains.users import User
from domains.activities import ActivityLog
from domains.workout_sessions import WorkoutSession
from domains.stats_dashboard_config import StatsDashboardConfig
from domains.exercises import ExerciseTree
from domains.parameters import Parameter


# --- Pydantic Schemas ---

class StatsOutput(BaseModel):
    """Schema for historical performance data with trends."""
    timestamp: datetime
    value: float
    label: str
    unit: Optional[str] = None
    trend_percentage: float = 0.0
    model_config = ConfigDict(from_attributes=True)


class PRRecord(BaseModel):
    """Entry for the Personal Record (PR) Hall of Fame."""
    exercise_name: str
    value: float
    unit: Optional[str] = None
    date: datetime


class TrainingDayDist(BaseModel):
    """Count of workouts per day of the week."""
    day_name: str
    count: int


class UserOverviewStats(BaseModel):
    """Consolidated high-level overview for the user dashboard."""
    total_workouts: int
    total_duration_minutes: int
    relative_rank_percentile: float  # e.g., Top 10%
    day_distribution: List[TrainingDayDist]
    pr_hall_of_fame: List[PRRecord]
    velocity_of_progress: Dict[str, float]  # Exercise name -> percentage change


class LeaderboardEntry(BaseModel):
    """Individual entry in the group leaderboard ranking."""
    full_name: str
    value: float
    rank: int


class GroupLeaderboardOutput(BaseModel):
    """Container for a specific exercise/parameter ranking set."""
    exercise_id: int
    exercise_name: str
    parameter_name: str
    unit: Optional[str] = None
    ranking_direction: str
    entries: List[LeaderboardEntry]


# --- StatisticsEngineService ---

class StatisticsEngineService:
    """
    Core engine for calculating real-time rankings and personal metrics.
    Uses Pandas for high-performance data aggregation and manipulation.
    """

    def __init__(self, db: Session):
        self.db = db

    def _get_all_descendants(self, parent_id: int, exercise_list: List[tuple]) -> List[int]:
        """Helper to resolve exercise hierarchy recursively."""
        descendants = [parent_id]
        for ex_id, p_id in exercise_list:
            if p_id == parent_id:
                descendants.extend(self._get_all_descendants(ex_id, exercise_list))
        return descendants

    def _extract_param_value(self, perf_data: Any, param_id: int) -> Optional[float]:
        """Parses parameter values from JSON list structures."""
        if isinstance(perf_data, list):
            for item in perf_data:
                if isinstance(item, dict) and item.get('parameter_id') == param_id:
                    try:
                        return float(item.get('value'))
                    except (ValueError, TypeError):
                        return None
        return None

    def _parse_duration(self, duration_str: Optional[str]) -> int:
        """Parses strings like '50 min' or '1 hour' into minutes."""
        if not duration_str:
            return 0
        try:
            return int(''.join(filter(str.isdigit, duration_str)))
        except (ValueError, TypeError):
            return 0

    def get_user_consolidated_overview(self, user_id: uuid.UUID, group_id: uuid.UUID) -> UserOverviewStats:
        """Calculates a comprehensive summary of user performance and behavior."""

        # 1. Fetch Session Data
        sessions = self.db.query(WorkoutSession).filter(WorkoutSession.user_id == user_id).all()
        df_sessions = pd.DataFrame([{
            "date": s.start_time,
            "duration": self._parse_duration(s.actual_duration),
            "day": s.start_time.strftime('%A')
        } for s in sessions]) if sessions else pd.DataFrame()

        total_workouts = len(sessions)
        total_duration = int(df_sessions['duration'].sum()) if not df_sessions.empty else 0

        # 2. Training Day Distribution
        days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        if not df_sessions.empty:
            dist = df_sessions['day'].value_counts().reindex(days_order, fill_value=0)
            day_dist = [TrainingDayDist(day_name=day, count=int(count)) for day, count in dist.items()]
        else:
            day_dist = [TrainingDayDist(day_name=day, count=0) for day in days_order]

        # 3. Relative Ranking (Percentile based on workouts current month)
        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0)
        group_counts = self.db.query(
            WorkoutSession.user_id, func.count(WorkoutSession.id).label('count')
        ).join(User, WorkoutSession.user_id == User.id).filter(
            User.group_id == group_id,
            WorkoutSession.start_time >= start_of_month
        ).group_by(WorkoutSession.user_id).all()

        df_ranks = pd.DataFrame(group_counts, columns=['uid', 'count'])
        if not df_ranks.empty:
            df_ranks['percentile'] = df_ranks['count'].rank(pct=True) * 100
            user_row = df_ranks[df_ranks['uid'] == user_id]
            # Lower rank number (Top X%) is better
            relative_rank = 100 - user_row['percentile'].iloc[0] if not user_row.empty else 100.0
        else:
            relative_rank = 100.0

        # 4. PR Hall of Fame & Velocity (Optimized Python-based enrichment)
        logs = self.db.query(ActivityLog, ExerciseTree.name.label('ex_name')).join(
            ExerciseTree, ActivityLog.exercise_id == ExerciseTree.id
        ).filter(ActivityLog.user_id == user_id).all()

        # Pre-fetch parameters to avoid N+1 queries during processing
        params_meta = {p.id: p for p in self.db.query(Parameter).filter(Parameter.group_id == group_id).all()}

        pr_list = []
        velocity_map = {}

        if logs:
            raw_perf = []
            for log, ex_name in logs:
                for entry in (log.performance_data or []):
                    p_id = entry.get('parameter_id')
                    meta = params_meta.get(p_id)
                    if meta:
                        raw_perf.append({
                            "exercise": ex_name,
                            "p_id": p_id,
                            "value": float(entry.get('value', 0)),
                            "date": log.timestamp,
                            "unit": meta.unit
                        })

            df_perf = pd.DataFrame(raw_perf)

            if not df_perf.empty:
                # PR Hall of Fame: Get highest value recorded for each exercise
                pr_idx = df_perf.groupby('exercise')['value'].idxmax()
                df_prs = df_perf.loc[pr_idx].sort_values('date', ascending=False)

                for _, row in df_prs.head(10).iterrows():
                    pr_list.append(PRRecord(
                        exercise_name=row['exercise'],
                        value=row['value'],
                        unit=row['unit'],
                        date=row['date']
                    ))

                # Velocity: Comparison between current 30d window and the 30d window before it
                now = datetime.now(timezone.utc) if df_perf['date'].dt.tz else datetime.now()
                last_month = df_perf[df_perf['date'] >= (now - timedelta(days=30))]
                prev_month = df_perf[
                    (df_perf['date'] >= (now - timedelta(days=60))) & (df_perf['date'] < (now - timedelta(days=30)))]

                for ex in df_perf['exercise'].unique():
                    m1 = last_month[last_month['exercise'] == ex]['value'].mean()
                    m2 = prev_month[prev_month['exercise'] == ex]['value'].mean()
                    if m1 and m2 and m2 > 0:
                        velocity_map[ex] = round(((m1 - m2) / m2) * 100, 2)

        return UserOverviewStats(
            total_workouts=total_workouts,
            total_duration_minutes=total_duration,
            relative_rank_percentile=round(relative_rank, 1),
            day_distribution=day_dist,
            pr_hall_of_fame=pr_list,
            velocity_of_progress=velocity_map
        )

    def calculate_realtime_stats(self, user_id: uuid.UUID, exercise_id: int, group_id: uuid.UUID) -> List[
        Dict[str, Any]]:
        """Calculates personal progress for a specific exercise and its sub-categories."""
        all_exercises = self.db.query(ExerciseTree.id, ExerciseTree.parent_id).filter(
            ExerciseTree.group_id == group_id).all()
        relevant_exercise_ids = self._get_all_descendants(exercise_id, all_exercises)

        logs = self.db.query(ActivityLog).filter(
            ActivityLog.user_id == user_id,
            ActivityLog.exercise_id.in_(relevant_exercise_ids)
        ).order_by(ActivityLog.timestamp.asc()).all()

        if not logs:
            return []

        all_params = self.db.query(Parameter).all()
        param_map = {p.id: p for p in all_params}

        raw_data = []
        for log in logs:
            perf = log.performance_data or []
            p_ids = [item.get('parameter_id') for item in perf if isinstance(item, dict)]

            for pid in set(p_ids):
                val = self._extract_param_value(perf, pid)
                if val is not None:
                    param_meta = param_map.get(pid)
                    raw_data.append({
                        "timestamp": log.timestamp,
                        "value": float(val),
                        "label": param_meta.name if param_meta else f"Param {pid}",
                        "unit": param_meta.unit if param_meta else None,
                        "strategy": param_meta.aggregation_strategy if param_meta else "sum",
                        "date": log.timestamp.date()
                    })

        df = pd.DataFrame(raw_data)
        if df.empty:
            return []

        final_results = []
        for label, group in df.groupby('label'):
            strategy = group['strategy'].iloc[0]
            unit = group['unit'].iloc[0]

            if strategy == "max":
                daily = group.groupby('date').agg({'value': 'max', 'timestamp': 'first'}).reset_index()
            elif strategy == "min":
                daily = group.groupby('date').agg({'value': 'min', 'timestamp': 'first'}).reset_index()
            elif strategy == "avg":
                daily = group.groupby('date').agg({'value': 'mean', 'timestamp': 'first'}).reset_index()
            elif strategy == "latest":
                daily = group.sort_values('timestamp').groupby('date').tail(1)
            else:
                daily = group.groupby('date').agg({'value': 'sum', 'timestamp': 'first'}).reset_index()

            daily = daily.sort_values('timestamp')
            daily['label'] = label
            daily['unit'] = unit
            daily['trend_percentage'] = daily['value'].pct_change() * 100

            final_results.extend(daily.fillna(0).to_dict('records'))

        return final_results

    def get_group_leaderboards(self, group_id: uuid.UUID, start_date: datetime, end_date: datetime) -> List[
        Dict[str, Any]]:
        """Calculates group-wide rankings based on coach dashboard configurations."""
        group_users = self.db.query(User.first_name, User.second_name).filter(User.group_id == group_id).all()
        all_user_names = [f"{u.first_name or ''} {u.second_name or ''}".strip() or "Trainee" for u in group_users]
        df_all_users = pd.DataFrame({"full_name": all_user_names})

        configs = self.db.query(
            StatsDashboardConfig,
            ExerciseTree.name.label("exercise_name"),
            Parameter.name.label("parameter_name"),
            Parameter.unit.label("unit"),
            Parameter.aggregation_strategy.label("strategy")
        ).join(ExerciseTree, StatsDashboardConfig.exercise_id == ExerciseTree.id) \
            .join(Parameter, StatsDashboardConfig.parameter_id == Parameter.id) \
            .filter(StatsDashboardConfig.group_id == group_id, StatsDashboardConfig.is_public == True) \
            .order_by(StatsDashboardConfig.display_order.asc()) \
            .all()

        if not configs:
            return []

        all_exercises = self.db.query(ExerciseTree.id, ExerciseTree.parent_id).filter(
            ExerciseTree.group_id == group_id).all()

        exercise_mapping = {c[0].exercise_id: self._get_all_descendants(c[0].exercise_id, all_exercises) for c in
                            configs}
        all_relevant_ids = list(set([item for sublist in exercise_mapping.values() for item in sublist]))

        logs = self.db.query(ActivityLog, User.first_name, User.second_name) \
            .join(User, ActivityLog.user_id == User.id) \
            .filter(
            User.group_id == group_id,
            ActivityLog.exercise_id.in_(all_relevant_ids),
            ActivityLog.timestamp >= start_date,
            ActivityLog.timestamp <= end_date
        ).all()

        raw_rows = []
        for log, f_name, s_name in logs:
            full_name = f"{f_name or ''} {s_name or ''}".strip() or "Trainee"
            raw_rows.append({
                "full_name": full_name,
                "exercise_id": log.exercise_id,
                "perf_data": log.performance_data,
                "timestamp": log.timestamp
            })

        df_logs = pd.DataFrame(raw_rows) if raw_rows else pd.DataFrame(
            columns=["full_name", "exercise_id", "perf_data", "timestamp"])

        leaderboards = []
        for cfg_row in configs:
            cfg = cfg_row[0]
            relevant_child_ids = exercise_mapping[cfg.exercise_id]
            param_id = int(cfg.parameter_id)
            strategy = cfg_row.strategy or "sum"

            ex_df = df_logs[
                df_logs['exercise_id'].isin(relevant_child_ids)].copy() if not df_logs.empty else pd.DataFrame()

            if not ex_df.empty:
                ex_df['val'] = ex_df['perf_data'].apply(lambda x: self._extract_param_value(x, param_id))
                ex_df = ex_df.dropna(subset=['val'])

                if strategy == "max":
                    user_best = ex_df.groupby('full_name')['val'].max().reset_index()
                elif strategy == "min":
                    user_best = ex_df.groupby('full_name')['val'].min().reset_index()
                elif strategy == "avg":
                    user_best = ex_df.groupby('full_name')['val'].mean().reset_index()
                elif strategy == "latest":
                    user_best = ex_df.sort_values('timestamp').groupby('full_name').tail(1)[['full_name', 'val']]
                else:
                    user_best = ex_df.groupby('full_name')['val'].sum().reset_index()
            else:
                user_best = pd.DataFrame(columns=["full_name", "val"])

            final_df = pd.merge(df_all_users, user_best, on="full_name", how="left").fillna(0)
            final_df = final_df.sort_values(by='val', ascending=(cfg.ranking_direction != "desc"))

            leaderboards.append({
                "exercise_id": cfg.exercise_id,
                "exercise_name": cfg_row.exercise_name,
                "parameter_name": cfg_row.parameter_name,
                "unit": cfg_row.unit,
                "ranking_direction": cfg.ranking_direction,
                "entries": [{"full_name": r['full_name'], "value": float(r['val']), "rank": i}
                            for i, r in enumerate(final_df.to_dict('records'), 1)]
            })

        return leaderboards


# --- Router Setup ---

router = APIRouter(prefix="/stats", tags=["Statistics Engine"])


@router.get("/overview/", response_model=UserOverviewStats)
async def get_user_overview(
        target_user_id: Optional[uuid.UUID] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches high-level consolidated stats for the user dashboard."""
    uid = target_user_id if (target_user_id and current_user.role in ["admin", "trainer"]) else current_user.id
    service = StatisticsEngineService(db)
    return service.get_user_consolidated_overview(uid, current_user.group_id)


@router.get("/personal/{exercise_id}/", response_model=List[StatsOutput])
async def get_personal_stats(
        exercise_id: int,
        target_user_id: Optional[uuid.UUID] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches personal performance trends aggregated across the exercise hierarchy."""
    uid = target_user_id if (target_user_id and current_user.role in ["admin", "trainer"]) else current_user.id
    service = StatisticsEngineService(db)
    return service.calculate_realtime_stats(uid, exercise_id, current_user.group_id)


@router.get("/group-leaderboard/", response_model=List[GroupLeaderboardOutput])
async def get_group_leaderboard(
        start_date: datetime,
        end_date: datetime,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches group-wide rankings for the public dashboard within a timeframe."""
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    service = StatisticsEngineService(db)
    return service.get_group_leaderboards(current_user.group_id, start_date, end_date)