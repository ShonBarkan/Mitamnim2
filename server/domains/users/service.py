import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from .models import User, UserCreate


# --- UserService (Business Logic) ---

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id) -> Optional[User]:
        """Fetches a specific user pre-loading relation configurations."""
        return self.db.query(User).options(joinedload(User.group)).filter(User.id == user_id).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        """Queries database for a unique username matching configuration constraints."""
        return self.db.query(User).options(joinedload(User.group)).filter(User.username == username).first()

    def get_users_by_group(self, group_id) -> List[User]:
        """Pulls all users attached to a specific group frame scope context."""
        return self.db.query(User).options(joinedload(User.group)).filter(User.group_id == group_id).all()

    def create_user(self, user_data: UserCreate, hashed_password: str, target_group_id: Optional[uuid.UUID]) -> User:
        """Atomically handles credentials hashing and binds users to groups context frameworks."""
        new_user = User(
            id=uuid.uuid4(),
            **user_data.model_dump(exclude={"password", "group_id"}),
            password=hashed_password,
            group_id=target_group_id
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        # Re-fetch with group mapped to satisfy schema structures validation metrics smoothly
        return self.get_user_by_id(new_user.id)

    def update_user(self, db_user: User, update_data: dict) -> User:
        """Mutates record properties context fields dynamically inside transaction logs."""
        for key, value in update_data.items():
            setattr(db_user, key, value)
        self.db.commit()
        self.db.refresh(db_user)
        return self.get_user_by_id(db_user.id)

    def delete_user(self, db_user: User):
        """Permanently drops user record instance boundaries from database schemas."""
        self.db.delete(db_user)
        self.db.commit()