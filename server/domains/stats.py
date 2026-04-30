import uuid
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Optional, Dict, Any

from sqlalchemy import and_
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Infrastructure and security imports
from db.database import get_db
from middlewares.auth import get_current_user
from domains.users import User
from domains.activities import ActivityLog
from domains.parameter_formulas import ParameterFormula
from domains.parameter_conversions import ParameterConversion
from domains.stats_dashboard_config import StatsDashboardConfig
from domains.exercises import ExerciseTree
from domains.parameters import Parameter


class StatsOutput(BaseModel):
    timestamp: datetime
    value: float
    label: str
    unit: Optional[str] = None
    trend_percentage: float = 0.0
    model_config = ConfigDict(from_attributes=True)


class LeaderboardEntry(BaseModel):
    full_name: str
    value: float
    rank: int


class GroupLeaderboardOutput(BaseModel):
    exercise_id: int
    exercise_name: str
    parameter_name: str
    unit: Optional[str] = None
    ranking_direction: str
    entries: List[LeaderboardEntry]


class StatisticsEngineService:
    def __init__(self, db: Session):
        self.db = db

    def get_group_leaderboards(self, group_id: uuid.UUID, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        print(f"\n{'=' * 60}")
        print(f"DEBUG: STARTING LEADERBOARD CALCULATION WITH AGGREGATION STRATEGY")
        print(f"{'=' * 60}")

        # 1. Fetch all users in the group
        group_users = self.db.query(User.first_name, User.second_name).filter(User.group_id == group_id).all()
        all_user_names = [f"{u.first_name or ''} {u.second_name or ''}".strip() or "Trainee" for u in group_users]
        df_all_users = pd.DataFrame({"full_name": all_user_names})

        # 2. Check Coach Configs - Now including Parameter.aggregation_strategy and sorting by display_order
        configs = self.db.query(
            StatsDashboardConfig,
            ExerciseTree.name.label("exercise_name"),
            Parameter.name.label("parameter_name"),
            Parameter.unit.label("unit"),
            Parameter.aggregation_strategy.label("strategy") # Fetching the new column
        ).join(ExerciseTree, StatsDashboardConfig.exercise_id == ExerciseTree.id) \
            .join(Parameter, StatsDashboardConfig.parameter_id == Parameter.id) \
            .filter(and_(StatsDashboardConfig.group_id == group_id, StatsDashboardConfig.is_public == True)) \
            .order_by(StatsDashboardConfig.display_order.asc()) \
            .all()

        if not configs:
            print("DEBUG: ALERT - No public configurations found.")
            return []

        # 3. Map Exercise Tree (Hierarchy support)
        all_exercises = self.db.query(ExerciseTree.id, ExerciseTree.parent_id).filter(
            ExerciseTree.group_id == group_id).all()

        def get_all_descendants(parent_id, exercise_list):
            descendants = [parent_id]
            for ex_id, p_id in exercise_list:
                if p_id == parent_id:
                    descendants.extend(get_all_descendants(ex_id, exercise_list))
            return descendants

        config_exercise_ids = [c[0].exercise_id for c in configs]
        exercise_mapping = {ex_id: get_all_descendants(ex_id, all_exercises) for ex_id in config_exercise_ids}
        all_relevant_ids = list(set([item for sublist in exercise_mapping.values() for item in sublist]))

        # 4. Fetch Logs
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

        # 5. Iterative Calculation per Configuration
        for cfg_row in configs:
            cfg = cfg_row[0]
            target_parent_id = cfg.exercise_id
            relevant_child_ids = exercise_mapping[target_parent_id]
            param_id_to_find = int(cfg.parameter_id)
            strategy = cfg_row.strategy or "sum" # Use the new strategy column

            ex_df = df_logs[df_logs['exercise_id'].isin(relevant_child_ids)].copy() if not df_logs.empty else pd.DataFrame()

            def extract_val(perf_data):
                if isinstance(perf_data, list):
                    for item in perf_data:
                        if isinstance(item, dict) and item.get('parameter_id') == param_id_to_find:
                            try: return float(item.get('value'))
                            except: return None
                elif isinstance(perf_data, dict):
                    val = perf_data.get(str(param_id_to_find)) or perf_data.get(param_id_to_find)
                    try: return float(val) if val is not None else None
                    except: return None
                return None

            if not ex_df.empty:
                ex_df['val'] = ex_df['perf_data'].apply(extract_val)
                ex_df = ex_df.dropna(subset=['val'])

                # Apply aggregation based on Parameter.aggregation_strategy
                if strategy == "max":
                    user_best = ex_df.groupby('full_name')['val'].max().reset_index()
                elif strategy == "min":
                    user_best = ex_df.groupby('full_name')['val'].min().reset_index()
                elif strategy == "avg":
                    user_best = ex_df.groupby('full_name')['val'].mean().reset_index()
                elif strategy == "latest":
                    # Sort by timestamp and take the last one for each user
                    user_best = ex_df.sort_values('timestamp').groupby('full_name').tail(1)[['full_name', 'val']]
                else: # Default to "sum"
                    user_best = ex_df.groupby('full_name')['val'].sum().reset_index()
            else:
                user_best = pd.DataFrame(columns=["full_name", "val"])

            # 6. Merge and Final Ranking
            final_df = pd.merge(df_all_users, user_best, on="full_name", how="left")
            final_df['val'] = final_df['val'].fillna(0)

            # Ranking Direction still controls the visual order (Ascending vs Descending)
            is_ascending = (cfg.ranking_direction != "desc")
            final_df = final_df.sort_values(by='val', ascending=is_ascending)

            entries = []
            for i, (_, row) in enumerate(final_df.iterrows(), 1):
                entries.append({
                    "full_name": row['full_name'],
                    "value": float(row['val']),
                    "rank": i
                })

            leaderboards.append({
                "exercise_id": target_parent_id,
                "exercise_name": cfg_row.exercise_name,
                "parameter_name": cfg_row.parameter_name,
                "unit": cfg_row.unit,
                "ranking_direction": cfg.ranking_direction,
                "entries": entries
            })

        print(f"DEBUG: FINAL RESULT - Returning {len(leaderboards)} leaderboards sorted by display_order.")
        return leaderboards

    # personal stats calculation remains the same
    def calculate_realtime_stats(self, user_id: uuid.UUID, exercise_id: int, group_id: uuid.UUID) -> List[Dict[str, Any]]:
        logs = self.db.query(ActivityLog).filter(ActivityLog.user_id == user_id,
                                                 ActivityLog.exercise_id == exercise_id).order_by(
            ActivityLog.timestamp.asc()).all()
        if not logs: return []
        formulas = self.db.query(ParameterFormula).filter(ParameterFormula.group_id == group_id).all()
        conversions = self.db.query(ParameterConversion).filter(ParameterConversion.group_id == group_id).all()
        calculated_data = []
        for log in logs:
            perf = log.performance_data or []
            def get_val_from_list(p_list, p_id):
                if isinstance(p_list, list):
                    for item in p_list:
                        if isinstance(item, dict) and item.get('parameter_id') == p_id:
                            return item.get('value')
                return None

            for conv in conversions:
                val = get_val_from_list(perf, conv.source_parameter_id)
                if val is not None:
                    calculated_data.append(
                        {"timestamp": log.timestamp, "value": float(val) * conv.multiplier, "label": conv.target_name,
                         "unit": conv.unit})
            for formula in formulas:
                vals = []
                for pid in formula.source_parameter_ids:
                    v = get_val_from_list(perf, pid)
                    vals.append(float(v) if v is not None else 0.0)

                if not any(vals) and formula.operation == "multiply": continue
                res = np.prod(vals) if formula.operation == "multiply" else np.sum(vals)
                calculated_data.append({"timestamp": log.timestamp, "value": float(res), "label": formula.target_name,
                                        "unit": formula.unit})

        df = pd.DataFrame(calculated_data)
        if df.empty: return []
        df = df.sort_values('timestamp')
        final_results = []
        for label, group in df.groupby('label'):
            group = group.copy()
            group['trend_percentage'] = group['value'].pct_change() * 100
            final_results.extend(group.fillna(0).to_dict('records'))
        return final_results


router = APIRouter(prefix="/stats", tags=["Statistics Engine"])

@router.get("/personal/{exercise_id}/", response_model=List[StatsOutput])
async def get_personal_stats(exercise_id: int, target_user_id: Optional[uuid.UUID] = None,
                             db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query_user_id = current_user.id
    if target_user_id and current_user.role in ["admin", "trainer"]:
        query_user_id = target_user_id
    elif target_user_id and target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")
    service = StatisticsEngineService(db)
    return service.calculate_realtime_stats(query_user_id, exercise_id, current_user.group_id)


@router.get("/group-leaderboard/", response_model=List[GroupLeaderboardOutput])
async def get_group_leaderboard(start_date: datetime, end_date: datetime, db: Session = Depends(get_db),
                                current_user: User = Depends(get_current_user)):
    if start_date > end_date: raise HTTPException(status_code=400, detail="Start date must be before end date")
    service = StatisticsEngineService(db)
    return service.get_group_leaderboards(group_id=current_user.group_id, start_date=start_date, end_date=end_date)