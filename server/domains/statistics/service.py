import uuid
import calendar
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import func, cast, Float
from sqlalchemy.orm import Session
from core.logger import logger

from domains.ExerciseLog.models import ExerciseLog, ExerciseLogParam
from domains.dashboard_configs.models import DashboardConfig
from domains.users.models import User


class StatisticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_stats(self, group_id: uuid.UUID, period: str) -> dict:
        now = datetime.now()

        # Calculate strict boundaries for start_date and end_date
        if period == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)

        elif period == 'week':
            # Assuming the week starts on Sunday
            days_since_sunday = (now.weekday() + 1) % 7
            start_date = (now - timedelta(days=days_since_sunday)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = (start_date + timedelta(days=6)).replace(hour=23, minute=59, second=59, microsecond=999999)

        else:  # month
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_day = calendar.monthrange(now.year, now.month)[1]
            end_date = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)

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

            # Retrieve unit from the parameter relationship
            unit = getattr(config.parameter, 'unit', 'units')

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

    def get_athlete_stats(
            self,
            user_id: uuid.UUID,
            parameter_name: str,
            exercise_id: Optional[int] = None,
            months_back: int = 3
    ) -> dict:
        """
        Retrieves historical trend data for a specific athlete.
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30 * months_back)

        query = (
            self.db.query(
                func.date_trunc('day', ExerciseLog.created_at).label('log_date'),
                func.max(cast(ExerciseLogParam.value, Float)).label('best_value'),
                func.max(ExerciseLogParam.parameter_unit).label('unit')  # Aggregate unit
            )
            .join(ExerciseLogParam, ExerciseLogParam.log_id == ExerciseLog.id)
            .filter(ExerciseLog.user_id == user_id)
            .filter(ExerciseLogParam.parameter_name == parameter_name)
            .filter(ExerciseLog.created_at.between(start_date, end_date))
        )

        if exercise_id:
            query = query.filter(ExerciseLog.exercise_id == exercise_id)

        query = query.group_by('log_date').order_by('log_date')
        records = query.all()

        trends = [{"date": r.log_date, "value": float(r.best_value)} for r in records if r.best_value is not None]

        # Get unit from the first record found
        unit = records[0].unit if records else ""

        values = [t["value"] for t in trends]
        max_val = max(values) if values else None
        avg_val = sum(values) / len(values) if values else None

        return {
            "user_id": user_id,
            "exercise_id": exercise_id,
            "parameter_name": parameter_name,
            "parameter_unit": unit,
            "trends": trends,
            "max_value": round(max_val, 2) if max_val else None,
            "avg_value": round(avg_val, 2) if avg_val else None
        }

    def get_group_trends(
            self,
            group_id: uuid.UUID,
            parameter_name: str,
            exercise_id: Optional[int] = None,
            months_back: int = 3
    ) -> dict:
        """
        Aggregates trends across all users in a group.
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30 * months_back)

        query = (
            self.db.query(
                func.date_trunc('day', ExerciseLog.created_at).label('log_date'),
                func.avg(cast(ExerciseLogParam.value, Float)).label('avg_val'),
                func.max(cast(ExerciseLogParam.value, Float)).label('max_val'),
                func.max(ExerciseLogParam.parameter_unit).label('unit')  # Aggregate unit
            )
            .join(ExerciseLogParam, ExerciseLogParam.log_id == ExerciseLog.id)
            .join(User, ExerciseLog.user_id == User.id)
            .filter(User.group_id == group_id)
            .filter(ExerciseLogParam.parameter_name == parameter_name)
            .filter(ExerciseLog.created_at.between(start_date, end_date))
        )

        if exercise_id:
            query = query.filter(ExerciseLog.exercise_id == exercise_id)

        query = query.group_by('log_date').order_by('log_date')
        records = query.all()

        unit = records[0].unit if records else ""

        trends = [
            {
                "date": r.log_date,
                "avg_value": round(float(r.avg_val), 2),
                "max_value": float(r.max_val)
            }
            for r in records if r.avg_val is not None
        ]

        return {
            "group_id": group_id,
            "exercise_id": exercise_id,
            "parameter_name": parameter_name,
            "parameter_unit": unit,
            "trends": trends
        }