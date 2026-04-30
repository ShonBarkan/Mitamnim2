import uuid
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Optional, Dict, Any

from sqlalchemy import and_
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and core imports
from db.database import get_db
from middlewares.auth import get_current_user
from domains.users import User
from domains.activities import ActivityLog
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
        """Parses parameter values from both JSON list and dictionary structures."""
        if isinstance(perf_data, list):
            for item in perf_data:
                if isinstance(item, dict) and item.get('parameter_id') == param_id:
                    try:
                        return float(item.get('value'))
                    except (ValueError, TypeError):
                        return None
        elif isinstance(perf_data, dict):
            val = perf_data.get(str(param_id)) or perf_data.get(param_id)
            try:
                return float(val) if val is not None else None
            except (ValueError, TypeError):
                return None
        return None

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
            .filter(and_(StatsDashboardConfig.group_id == group_id, StatsDashboardConfig.is_public == True)) \
            .order_by(StatsDashboardConfig.display_order.asc()) \
            .all()

        if not configs:
            return []

        all_exercises = self.db.query(ExerciseTree.id, ExerciseTree.parent_id).filter(
            ExerciseTree.group_id == group_id).all()

        config_exercise_ids = [c[0].exercise_id for c in configs]
        exercise_mapping = {ex_id: self._get_all_descendants(ex_id, all_exercises) for ex_id in config_exercise_ids}
        all_relevant_ids = list(set([item for sublist in exercise_mapping.values() for item in sublist]))

        logs = self.db.query(ActivityLog, User.first_name, User.second_name) \
            .join(User, ActivityLog.user_id == User.id) \
            .filter(and_(
            User.group_id == group_id,
            ActivityLog.exercise_id.in_(all_relevant_ids),
            ActivityLog.timestamp >= start_date,
            ActivityLog.timestamp <= end_date
        )).all()

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
            target_parent_id = cfg.exercise_id
            relevant_child_ids = exercise_mapping[target_parent_id]
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
            is_ascending = (cfg.ranking_direction != "desc")
            final_df = final_df.sort_values(by='val', ascending=is_ascending)

            leaderboards.append({
                "exercise_id": target_parent_id,
                "exercise_name": cfg_row.exercise_name,
                "parameter_name": cfg_row.parameter_name,
                "unit": cfg_row.unit,
                "ranking_direction": cfg.ranking_direction,
                "entries": [{"full_name": r['full_name'], "value": float(r['val']), "rank": i}
                            for i, r in enumerate(final_df.to_dict('records'), 1)]
            })

        return leaderboards

    def calculate_realtime_stats(self, user_id: uuid.UUID, exercise_id: int, group_id: uuid.UUID) -> List[
        Dict[str, Any]]:
        """Calculates personal progress aggregated across the exercise hierarchy."""
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
            # Extract all available parameters found in this log
            p_ids = []
            if isinstance(perf, list):
                p_ids = [item.get('parameter_id') for item in perf if isinstance(item, dict)]
            elif isinstance(perf, dict):
                p_ids = [int(k) for k in perf.keys() if str(k).isdigit()]

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
        # Process each parameter type separately
        for label, group in df.groupby('label'):
            strategy = group['strategy'].iloc[0]
            unit = group['unit'].iloc[0]

            # Aggregation: Group by date to provide daily data points based on strategy
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


# --- Router Setup ---

router = APIRouter(prefix="/stats", tags=["Statistics Engine"])


@router.get("/personal/{exercise_id}/", response_model=List[StatsOutput])
async def get_personal_stats(
        exercise_id: int,
        target_user_id: Optional[uuid.UUID] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetches personal performance trends aggregated across the exercise hierarchy."""
    query_user_id = current_user.id
    if target_user_id and current_user.role in ["admin", "trainer"]:
        query_user_id = target_user_id
    elif target_user_id and target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")

    service = StatisticsEngineService(db)
    return service.calculate_realtime_stats(query_user_id, exercise_id, current_user.group_id)


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
    return service.get_group_leaderboards(
        group_id=current_user.group_id,
        start_date=start_date,
        end_date=end_date
    )