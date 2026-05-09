from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from middlewares.auth import AuthService, get_current_user

from .models import UserOut, UserCreate, UserUpdate
from .service import UserService


# --- Router Setup ---

router = APIRouter(prefix="/users", tags=["Users"])
auth_router = APIRouter(tags=["Authentication"])


@auth_router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticates user and returns JWT access token."""
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
        target_group_id,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """Fetches all users belonging to a specific group."""
    if current_user.role != "admin" and current_user.group_id != target_group_id:
        raise HTTPException(status_code=403, detail="Access denied to group members")

    service = UserService(db)
    return service.get_users_by_group(target_group_id)


@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user = Depends(get_current_user)):
    """Returns the profile of the currently logged-in user."""
    return current_user


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=UserOut)
async def create_new_user(
        user_data: UserCreate,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """Creates a new user with context-aware role and group validation."""
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
        user_id,
        user_update: UserUpdate,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """Updates user profile details with permission checks for sensitive fields."""
    user_service = UserService(db)
    auth_service = AuthService(db)

    db_user = user_service.get_user_by_id(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    is_admin = current_user.role == "admin"
    is_self = current_user.id == user_id
    is_trainer_of_group = (current_user.role == "trainer" and db_user.group_id == current_user.group_id)

    # Basic authorization check
    if not (is_admin or is_self or is_trainer_of_group):
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = user_update.model_dump(exclude_unset=True)

    # Prevent non-admins from CHANGING roles or groups
    if not is_admin:
        if "role" in update_data and update_data["role"] != db_user.role:
            raise HTTPException(status_code=403, detail="Only admins can change roles")

        if "group_id" in update_data and update_data["group_id"] != db_user.group_id:
            raise HTTPException(status_code=403, detail="Only admins can move users between groups")

    if "password" in update_data:
        update_data["password"] = auth_service.get_password_hash(update_data["password"])

    return user_service.update_user(db_user, update_data)


@router.delete("/{user_id}")
async def remove_user(
        user_id,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """Permanently removes a user from the system."""
    user_service = UserService(db)
    db_user = user_service.get_user_by_id(user_id)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Admins or Trainers within the same group can delete users
    if current_user.role == "admin" or (current_user.role == "trainer" and db_user.group_id == current_user.group_id):
        user_service.delete_user(db_user)
        return {"message": "User deleted successfully"}

    raise HTTPException(status_code=403, detail="Unauthorized")
