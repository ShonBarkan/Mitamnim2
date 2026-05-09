from typing import List, Optional
from sqlalchemy.orm import Session

from .models import Group, GroupCreate


# --- GroupService (Business Logic Class) ---

class GroupService:
    """
    Service layer providing an interface for Group-related database operations.
    Encapsulates CRUD logic away from the API endpoints.
    """

    def __init__(self, db: Session):
        """Initializes the service with a database session."""
        self.db = db

    def get_group_by_id(self, group_id) -> Optional[Group]:
        """Retrieves a single group by its primary key ID."""
        return self.db.query(Group).filter(Group.id == group_id).first()

    def get_group_by_name(self, name: str) -> Optional[Group]:
        """Retrieves a group by its unique name."""
        return self.db.query(Group).filter(Group.name == name).first()

    def get_all_groups(self) -> List[Group]:
        """Retrieves all group records from the database."""
        return self.db.query(Group).all()

    def create_group(self, group_data: GroupCreate) -> Group:
        """Initializes and persists a new group record."""
        import uuid
        new_group = Group(
            id=uuid.uuid4(),
            **group_data.model_dump()
        )
        self.db.add(new_group)
        self.db.commit()
        self.db.refresh(new_group)
        return new_group

    def update_group(self, db_group: Group, update_data: dict) -> Group:
        """Applies dynamic updates to an existing group instance and commits changes."""
        for key, value in update_data.items():
            setattr(db_group, key, value)
        self.db.commit()
        self.db.refresh(db_group)
        return db_group

    def delete_group(self, db_group: Group):
        """Removes a group record from the database."""
        self.db.delete(db_group)
        self.db.commit()
