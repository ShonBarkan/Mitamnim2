import uuid
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from core.logger import logger
from .models import DashboardConfig, DashboardConfigCreate, DashboardConfigUpdate
from domains.WorkoutSession.models import WorkoutSession
from domains.ExerciseLog.models import ExerciseLog, ExerciseLogParam


class DashboardConfigService:
    def __init__(self, db: Session):
        self.db = db

    # --- Helper Methods ---

    def _get_next_position(self, group_id: uuid.UUID) -> int:
        """Calculates the next available position index for a group."""
        max_pos = self.db.query(func.max(DashboardConfig.position)) \
            .filter(DashboardConfig.group_id == group_id) \
            .scalar()
        return (max_pos or 0) + 1

    # --- CRUD Operations ---

    def create_config(self, data: DashboardConfigCreate) -> DashboardConfig:
        logger.info(f"Creating dashboard config for group: {data.group_id}")
        data_dict = data.model_dump()

        # Ensure position is at the end if not explicitly set
        if not data_dict.get('position') or data_dict['position'] == 0:
            data_dict['position'] = self._get_next_position(data.group_id)

        config = DashboardConfig(**data_dict)
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        return config

    def create_config_from_dict(self, data: dict) -> DashboardConfig:
        logger.info(f"Creating dashboard config from dict for group: {data.get('group_id')}")

        # Ensure position is at the end if not explicitly set
        if not data.get('position') or data['position'] == 0:
            data['position'] = self._get_next_position(data['group_id'])

        config = DashboardConfig(**data)
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        return config

    def get_configs(self, group_id: uuid.UUID) -> List[DashboardConfig]:
        return self.db.query(DashboardConfig) \
            .filter(DashboardConfig.group_id == group_id) \
            .order_by(DashboardConfig.position.asc()) \
            .all()

    def update_config(self, config_id: uuid.UUID, data: DashboardConfigUpdate) -> Optional[DashboardConfig]:
        config = self.db.query(DashboardConfig).filter(DashboardConfig.id == config_id).first()
        if not config:
            return None

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(config, key, value)

        self.db.commit()
        self.db.refresh(config)
        return config

    def delete_config(self, config_id: uuid.UUID) -> bool:
        config = self.db.query(DashboardConfig).filter(DashboardConfig.id == config_id).first()
        if config:
            self.db.delete(config)
            self.db.commit()
            return True
        return False

    def reorder_configs(self, reorder_data: List[dict]) -> bool:
        """
        Expects a list of dictionaries: [{'id': uuid, 'position': int}, ...]
        Updates all positions in a single transaction.
        """
        try:
            for item in reorder_data:
                config = self.db.query(DashboardConfig).filter(DashboardConfig.id == item['id']).first()
                if config:
                    config.position = item['position']

            self.db.commit()
            logger.info(f"Successfully reordered {len(reorder_data)} dashboard configurations.")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to reorder dashboard configurations: {str(e)}")
            return False
