import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from .models import StatsDashboardConfig, DashboardConfigCreate, DashboardConfigUpdate
from core.logger import logger


class DashboardService:
    """
    Service handling the display logic and ordering of dashboard items.
    Optimized for group-based multi-tenancy.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_group_configs(self, group_id: uuid.UUID) -> List[StatsDashboardConfig]:
        """Retrieves all dashboard settings for a group, sorted by display order."""
        return (
            self.db.query(StatsDashboardConfig)
            .filter(StatsDashboardConfig.group_id == group_id)
            .order_by(StatsDashboardConfig.display_order.asc())
            .all()
        )

    def create_config(self, data: DashboardConfigCreate, group_id: uuid.UUID) -> StatsDashboardConfig:
        """Adds a new item to the dashboard with automatic order calculation."""
        logger.info(f"Calculating next display order sequence index for group_id: {group_id}")

        max_order = self.db.query(func.max(StatsDashboardConfig.display_order)).filter(
            StatsDashboardConfig.group_id == group_id
        ).scalar()

        next_order = (max_order + 1) if max_order is not None else 0

        new_config = StatsDashboardConfig(
            group_id=group_id,
            display_order=next_order,
            **data.model_dump(exclude={'display_order'})
        )
        self.db.add(new_config)
        self.db.commit()
        self.db.refresh(new_config)

        logger.info(
            f"Dashboard card metric configuration created successfully with id: {new_config.id} for group: {group_id}")
        return new_config

    def update_config(self, config_id: int, group_id: uuid.UUID, data: DashboardConfigUpdate) -> Optional[
        StatsDashboardConfig]:
        """Updates specific fields of a configuration entry after verifying ownership."""
        db_config = self.db.query(StatsDashboardConfig).filter(
            StatsDashboardConfig.id == config_id,
            StatsDashboardConfig.group_id == group_id
        ).first()

        if not db_config:
            logger.warning(
                f"Dashboard mutation rejected: Config target {config_id} missing or out-of-bounds for group: {group_id}")
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_config, key, value)

        self.db.commit()
        self.db.refresh(db_config)
        return db_config

    def delete_config(self, config_id: int, group_id: uuid.UUID) -> bool:
        """Removes an item from the dashboard after verifying ownership."""
        db_config = self.db.query(StatsDashboardConfig).filter(
            StatsDashboardConfig.id == config_id,
            StatsDashboardConfig.group_id == group_id
        ).first()

        if not db_config:
            logger.warning(
                f"Dashboard target erasure rejected: Node {config_id} missing or boundary violation for group: {group_id}")
            return False

        self.db.delete(db_config)
        self.db.commit()
        logger.info(f"Dashboard layout configuration rule id: {config_id} permanently dropped from group: {group_id}")
        return True