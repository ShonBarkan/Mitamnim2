from typing import List, Optional
import uuid
from sqlalchemy.orm import Session
from .models import Group, GroupCreate
from core.logger import logger  # Integrated our centralized logging engine


class GroupService:
    """
    Service layer providing an interface for Group-related database operations.
    Encapsulates CRUD logic away from the API endpoints.
    """

    def __init__(self, db: Session):
        """Initializes the service with an active relational database session."""
        self.db = db

    def get_group_by_id(self, group_id: uuid.UUID) -> Optional[Group]:
        """Retrieves a single group record by its primary key UUID."""
        return self.db.query(Group).filter(Group.id == group_id).first()

    def get_group_by_name(self, name: str) -> Optional[Group]:
        """Retrieves a group record by its unique name string."""
        return self.db.query(Group).filter(Group.name == name).first()

    def get_all_groups(self) -> List[Group]:
        """Retrieves all group records stored in the database."""
        return self.db.query(Group).all()

    def create_group(self, group_data: GroupCreate) -> Group:
        """Initializes and persists a new organizational group record context."""
        logger.info(f"Attempting to register a new system group named: '{group_data.name}'")

        new_group = Group(**group_data.model_dump())
        self.db.add(new_group)
        self.db.commit()
        self.db.refresh(new_group)

        logger.info(f"Group successfully allocated and persisted with id: {new_group.id}")
        return new_group

    def update_group(self, db_group: Group, update_data: dict) -> Group:
        """Applies dynamic runtime parameter modifications to a verified group instance."""
        logger.info(f"Processing structural attribute updates for group_id: {db_group.id}")

        for key, value in update_data.items():
            setattr(db_group, key, value)

        self.db.commit()
        self.db.refresh(db_group)
        return db_group

    def delete_group(self, db_group: Group):
        """Removes a group record permanently from database persistence layers."""
        group_id = db_group.id
        logger.info(f"Initiating destructive flush sequence on group_id: {group_id}")

        self.db.delete(db_group)
        self.db.commit()

        logger.info(f"Group_id: {group_id} cleanly removed from system persistence schemas.")