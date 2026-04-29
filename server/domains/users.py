import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Session
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

# Internal imports
from db.database import Base, get_db
# Ensure middlewares/auth.py uses local imports for User to avoid circular issues
from middlewares.auth import AuthService, get_current_user


# --- Database Model ---

class User(Base):
    """
    SQLAlchemy model representing a User in the system.
    Handles profile information, authentication credentials, and group association.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String, nullable=True)
    second_name = Column(String, nullable=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    profile_picture = Column(Text, nullable=True)
    role = Column(String, nullable=False)  # 'admin', 'trainer', 'trainee'
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True)

    # Relationships
    group = relationship("Group", back_populates="users")


# --- Pydantic Schemas ---

class UserBase(BaseModel):
    """Base schema for User data."""
    username: str
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: str
    group_id: Optional[uuid.UUID] = None

    @field_validator("email", "username", "first_name", "second_name", "phone", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return None if v == "" else v


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str


class UserUpdate(BaseModel):
    """Schema for updating an existing user."""
    username: Optional[str] = None
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    group_id: Optional[uuid.UUID] = None

    @field_validator("email", "username", "first_name", "second_name", "phone", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return None if v == "" else v


class UserOut(UserBase):
    """Schema for outgoing user data."""
    id: uuid.UUID
    created_at: datetime
    last_login: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# --- UserService (Business Logic) ---

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_users_by_group(self, group_id: uuid.UUID) -> List[User]:
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


# --- Router Setup ---

# General router for /users/ paths
router = APIRouter(prefix="/users", tags=["Users"])

# Auth router for top-level /login
auth_router = APIRouter(tags=["Authentication"])


@auth_router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """ Authenticates user and returns JWT. Accessible at /login. """
    auth_service = AuthService(db)
    token_data = await auth_service.authenticate_user(form_data)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    return token_data


@router.get("/group", response_model=List[UserOut])
async def get_group_users(
        target_group_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Fetches all users in a group. Fixes the 405 error in the Frontend.
    Accessible at /users/group?target_group_id=...
    """
    # Permission check: Admin or member of the same group
    if current_user.role != "admin" and current_user.group_id != target_group_id:
        raise HTTPException(status_code=403, detail="Access denied to group members")

    service = UserService(db)
    return service.get_users_by_group(target_group_id)


@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """ Returns current user profile. Accessible at /users/me. """
    return current_user


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=UserOut)
async def create_new_user(
        user_data: UserCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """ Creates a new user with role validation. """
    user_service = UserService(db)
    auth_service = AuthService(db)

    if current_user.role == "trainee":
        raise HTTPException(status_code=403, detail="Trainees cannot create users")

    target_group_id = user_data.group_id
    if current_user.role == "trainer":
        if not current_user.group_id:
            raise HTTPException(status_code=400, detail="Trainer has no group context")
        target_group_id = current_user.group_id
        if user_data.role == "admin":
            raise HTTPException(status_code=403, detail="Trainers cannot create admins")

    if user_service.get_user_by_username(user_data.username):
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = auth_service.get_password_hash(user_data.password)
    return user_service.create_user(user_data, hashed_pw, target_group_id)


@router.patch("/{user_id}", response_model=UserOut)
async def update_existing_user(
        user_id: uuid.UUID,
        user_update: UserUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """ Updates user profile details. """
    user_service = UserService(db)
    auth_service = AuthService(db)

    db_user = user_service.get_user_by_id(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    is_admin = current_user.role == "admin"
    is_self = current_user.id == user_id
    is_trainer_of_group = (current_user.role == "trainer" and db_user.group_id == current_user.group_id)

    if not (is_admin or is_self or is_trainer_of_group):
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = user_update.model_dump(exclude_unset=True)

    if not is_admin:
        if "role" in update_data or "group_id" in update_data:
            raise HTTPException(status_code=403, detail="Only admins can change roles/groups")

    if "password" in update_data:
        update_data["password"] = auth_service.get_password_hash(update_data["password"])

    return user_service.update_user(db_user, update_data)


@router.delete("/{user_id}")
async def remove_user(
        user_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """ Permanently removes a user. """
    user_service = UserService(db)
    db_user = user_service.get_user_by_id(user_id)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == "admin" or (current_user.role == "trainer" and db_user.group_id == current_user.group_id):
        user_service.delete_user(db_user)
        return {"message": "User deleted successfully"}

    raise HTTPException(status_code=403, detail="Unauthorized")