import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func, cast, Float, case, extract
from sqlalchemy.orm import Session, selectinload
from core.logger import logger

from domains.ExerciseLog.models import ExerciseLog, ExerciseLogParam
from domains.WorkoutSession.models import WorkoutSession
from domains.dashboard_configs.models import DashboardConfig
from domains.users.models import User
from domains.exercises.models import Exercise
from domains.tags.models import Tag
from domains.parameters.models import Parameter


class StatisticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_stats(self, group_id: uuid.UUID, start_date: datetime, end_date: datetime) -> dict:
        """
        Returns aggregated dashboard stats for the group.
        """
        logger.info(f"Fetching dashboard stats for group {group_id} from {start_date} to {end_date}")

        configs = self.db.query(DashboardConfig) \
            .filter(DashboardConfig.group_id == group_id) \
            .order_by(DashboardConfig.position.asc()) \
            .all()

        results = {}

        for config in configs:
            query = (
                self.db.query(
                    ExerciseLog.user_id,
                    func.sum(cast(ExerciseLogParam.value, Float)).label("sum_val"),
                    func.max(cast(ExerciseLogParam.value, Float)).label("max_val"),
                    func.avg(cast(ExerciseLogParam.value, Float)).label("avg_val")
                )
                .join(ExerciseLogParam, ExerciseLogParam.log_id == ExerciseLog.id)
                .filter(ExerciseLog.created_at.between(start_date, end_date))
                .filter(ExerciseLogParam.parameter_name == config.parameter.name)
            )

            if config.exercise_id:
                query = query.filter(ExerciseLog.exercise_id == config.exercise_id)

            query = query.group_by(ExerciseLog.user_id)
            stats = query.all()

            agg_key = f"{config.aggregation_type.lower()}_val"
            user_results = {str(s.user_id): round(getattr(s, agg_key) or 0, 2) for s in stats}

            unit = getattr(config.parameter, 'unit', 'units') if hasattr(config,
                                                                         'parameter') and config.parameter else ""

            results[config.display_name] = {
                "user_data": user_results,
                "config": {
                    "aggregation": config.aggregation_type,
                    "higher_better": config.is_higher_better,
                    "exercise_id": config.exercise_id,
                    "position": config.position,
                    "parameter_unit": unit
                }
            }

        return {"stats": results}

    def get_athlete_statistics(self, user: User, start_date: datetime, end_date: datetime) -> dict:
        """
        Specific endpoint for an athlete to view their own raw statistics.
        """
        result = self._fetch_raw_stats_internal(user.group_id, [user.id], start_date, end_date)
        if result["data"]:
            return result["data"][0]
        return {
            "user_id": user.id,
            "first_name": user.first_name,
            "second_name": user.second_name,
            "profile_picture": user.profile_picture,
            "stats": {"total_sessions": 0, "total_duration_minutes": 0, "logs": []}
        }

    def get_group_statistics(self, user: User, start_date: datetime, end_date: datetime,
                             user_ids: Optional[List[uuid.UUID]] = None) -> dict:
        """
        Specific endpoint for trainers to view group-wide or specific subset statistics.
        """
        return self._fetch_raw_stats_internal(user.group_id, user_ids, start_date, end_date)

    def _fetch_raw_stats_internal(
            self,
            group_id: uuid.UUID,
            target_user_ids: Optional[List[uuid.UUID]],
            start_date: datetime,
            end_date: datetime
    ) -> dict:
        """
        Internal helper to fetch and construct raw statistics data.
        """
        logger.info(f"Fetching raw statistics for group {group_id}")

        # Pre-fetch parameter definitions for display_method mapping
        param_defs = {p.name: p for p in self.db.query(Parameter).filter(Parameter.group_id == group_id).all()}

        # Build exercise tags lookup map safely to avoid ORM relationship issues
        try:
            group_exercises = self.db.query(Exercise).options(selectinload(Exercise.tags)).filter(Exercise.group_id == group_id).all()
        except Exception:
            group_exercises = self.db.query(Exercise).filter(Exercise.group_id == group_id).all()

        exercise_tags_lookup = {}
        for ex in group_exercises:
            tags = getattr(ex, 'tags', [])
            exercise_tags_lookup[ex.id] = [{"id": t.id, "name": t.name, "color": t.color} for t in tags]

        users_query = self.db.query(User).filter(User.group_id == group_id)
        if target_user_ids:
            users_query = users_query.filter(User.id.in_(target_user_ids))
        users = users_query.all()

        session_stats = (
            self.db.query(
                WorkoutSession.user_id,
                func.count(WorkoutSession.id).label("total_sessions"),
                func.sum(
                    case(
                        (WorkoutSession.finished_at.isnot(None),
                         extract('epoch', WorkoutSession.finished_at - WorkoutSession.started_at) / 60.0),
                        else_=0.0
                    )
                ).label("total_duration")
            )
            .filter(WorkoutSession.started_at.between(start_date, end_date))
            .filter(WorkoutSession.user_id.in_([u.id for u in users]))
            .group_by(WorkoutSession.user_id)
            .all()
        )

        stats_map = {s.user_id: {"sessions": s.total_sessions, "duration": round(s.total_duration or 0.0, 2)} for s in
                     session_stats}

        # Query logs directly without referencing the unmapped Exercise relationship
        logs_query = (
            self.db.query(ExerciseLog)
            .filter(ExerciseLog.created_at.between(start_date, end_date))
            .filter(ExerciseLog.user_id.in_([u.id for u in users]))
            .options(selectinload(ExerciseLog.params))
        )

        all_logs = logs_query.order_by(ExerciseLog.created_at.desc()).all()

        logs_map = {}
        for log in all_logs:
            if log.user_id not in logs_map: logs_map[log.user_id] = []

            # Map log params with display methods
            processed_params = []
            for p in log.params:
                param_def = param_defs.get(p.parameter_name)
                processed_params.append({
                    "id": p.id,
                    "parameter_name": p.parameter_name,
                    "parameter_unit": p.parameter_unit,
                    "value": p.value,
                    "display_method": param_def.aggregation_strategy if param_def else None,
                    "tags": []  # Empty array for parameter tags setup
                })

            # Fetch tags dynamically from our lookup dictionary
            exercise_tags = exercise_tags_lookup.get(log.exercise_id, [])

            logs_map[log.user_id].append({
                "id": log.id,
                "session_id": log.session_id,
                "exercise_id": log.exercise_id,
                "exercise_name": log.exercise_name,
                "sets": log.sets,
                "created_at": log.created_at,
                "user_id": log.user_id,
                "position": log.position,
                "params": processed_params,
                "tags": exercise_tags
            })

        data = []
        for user in users:
            user_stats = stats_map.get(user.id, {"sessions": 0, "duration": 0.0})
            data.append({
                "user_id": user.id,
                "first_name": user.first_name,
                "second_name": user.second_name,
                "profile_picture": user.profile_picture,
                "stats": {
                    "total_sessions": user_stats["sessions"],
                    "total_duration_minutes": user_stats["duration"],
                    "logs": logs_map.get(user.id, [])
                }
            })

        return {"data": data}