import uuid
from typing import List, Optional
from sqlalchemy.orm import Session

from .models import User, UserCreate


# --- UserService (Business Logic) ---

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_users_by_group(self, group_id) -> List[User]:
        return self.db.query(User).filter(User.group_id == group_id).all()

    def create_user(self, user_data: UserCreate, hashed_password: str, target_group_id: Optional[uuid.UUID]) -> User:
        new_user = User(
            id=uuid.uuid4(),
            **user_data.model_dump(exclude={"password", "group_id"}),
            password=hashed_password,
            group_id=target_group_id
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user

    def update_user(self, db_user: User, update_data: dict) -> User:
        for key, value in update_data.items():
            setattr(db_user, key, value)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def delete_user(self, db_user: User):
        self.db.delete(db_user)
        self.db.commit()
