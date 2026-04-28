import os
import json
import uuid
import uvicorn
from typing import List, Optional, Dict
from datetime import datetime, timedelta

from dotenv import load_dotenv
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from sqlalchemy.dialects.postgresql import UUID
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import sessionmaker, Session, relationship, declarative_base
from sqlalchemy import create_engine, Column, String, Text, DateTime, ForeignKey, Boolean
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Group(Base):
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    group_image = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to users
    users = relationship("User", back_populates="group")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String, nullable=True)
    second_name = Column(String, nullable=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)  # Hashed password
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    profile_picture = Column(Text, nullable=True)
    role = Column(String, nullable=False)  # trainer, trainee, admin
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True)

    # Relationship to group
    group = relationship("Group", back_populates="users")


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fitness Management System API")

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
async def root():
    return {"message": "Server is running with environment variables loaded"}


# --- Security Configurations ---

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if the provided password matches the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash of the password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a encoded JWT token with an expiration time."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default expiration from .env
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add expiration time to the payload
    to_encode.update({"exp": expire})

    # Encode the JWT using the secret key and algorithm from .env
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency that validates the JWT token and returns the current user object.
    Throws 401 Unauthorized if validation fails.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token using our secret key
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    # Fetch user from DB
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


@app.post("/login", response_model=Token)
async def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    """
    Authenticates user and returns a JWT access token.
    """
    # 1. Fetch user from database
    user = db.query(User).filter(User.username == form_data.username).first()

    # 2. Verify existence and password
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create access token (using 'sub' as standard for username/subject)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )

    # 4. (Optional) Update last_login
    user.last_login = datetime.utcnow()
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}


from pydantic import EmailStr


######### users #############

class UserCreate(BaseModel):
    username: str
    password: str
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: str  # 'trainer' or 'trainee'
    group_id: Optional[uuid.UUID] = None


@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
        user_data: UserCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Creates a new user.
    - Admins can create any user in any group.
    - Trainers can only create users (usually trainees) within their own group.
    - Trainees cannot create users.
    """

    # 1. Authorization Check
    if current_user.role == "trainee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainees are not allowed to create users"
        )

    # 2. Group Logic for Trainers
    target_group_id = user_data.group_id
    if current_user.role == "trainer":
        # Force the group_id to be the trainer's group_id
        if not current_user.group_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trainer must be assigned to a group before creating users"
            )
        target_group_id = current_user.group_id

        # Trainers shouldn't be able to create Admins
        if user_data.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Trainers cannot create admin users"
            )

    # 3. Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # 4. Hash the password and create user object
    hashed_password = get_password_hash(user_data.password)

    new_user = User(
        id=uuid.uuid4(),
        username=user_data.username,
        password=hashed_password,
        first_name=user_data.first_name,
        second_name=user_data.second_name,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role,
        group_id=target_group_id
    )

    # 5. Save to DB
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully", "user_id": new_user.id}


@app.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
        user_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Deletes a user from the system.
    - Admins: Can delete any user.
    - Trainers: Can only delete users belonging to their own group.
    - Trainees: Not authorized to delete users.
    """

    # 1. Fetch the user to be deleted
    user_to_delete = db.query(User).filter(User.id == user_id).first()

    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 2. Authorization Logic
    if current_user.role == "admin":
        # Admin has full access
        pass

    elif current_user.role == "trainer":
        # Check if the user to delete belongs to the trainer's group
        if user_to_delete.group_id != current_user.group_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Trainers can only delete users within their own group"
            )

        # Prevent trainers from deleting other trainers or admins
        if user_to_delete.role in ["admin", "trainer"] and user_to_delete.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Trainers can only delete trainees"
            )

    else:
        # Trainees cannot delete anyone
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainees are not authorized to delete users"
        )

    # 3. Perform Deletion
    db.delete(user_to_delete)
    db.commit()

    return {"message": f"User with ID {user_id} has been deleted successfully"}


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    group_id: Optional[uuid.UUID] = None


@app.patch("/users/{user_id}")
async def update_user(
        user_id: uuid.UUID,
        user_update: UserUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Updates user information with permission checks:
    - Admins: Can update everything for anyone.
    - Trainers: Can update users in their group (but not promote them to admin).
    - Self: Users can update their own profile (but not their role or group).
    """

    # 1. Fetch user to update
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Authorization Logic
    is_admin = current_user.role == "admin"
    is_self = current_user.id == user_id
    is_trainer_of_group = (current_user.role == "trainer" and db_user.group_id == current_user.group_id)

    if not (is_admin or is_self or is_trainer_of_group):
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    # 3. Restriction Logic (What can be changed)
    update_data = user_update.dict(exclude_unset=True)  # Only take fields that were actually sent

    # Prevent non-admins from changing sensitive fields (role/group)
    if not is_admin:
        if "role" in update_data or "group_id" in update_data:
            raise HTTPException(
                status_code=403,
                detail="Only admins can update roles or group assignments"
            )

    # 4. Process the update
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])

    for key, value in update_data.items():
        setattr(db_user, key, value)

    # 5. Save to DB
    db.commit()
    db.refresh(db_user)

    return {"message": "User updated successfully", "user": db_user}


class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    group_id: Optional[uuid.UUID] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        orm_mode = True


@app.get("/users/group", response_model=List[UserOut])
async def get_group_users(
        target_group_id: Optional[uuid.UUID] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Returns a list of users based on roles:
    - Trainers: Only users from their own group.
    - Admins: Users from a specific group, or all users if no group_id is provided.
    - Trainees: Forbidden.
    """

    # 1. Trainee check
    if current_user.role == "trainee":
        raise HTTPException(status_code=403, detail="Trainees cannot view group lists")

    query = db.query(User)

    # 2. Logic for Trainer
    if current_user.role == "trainer":
        if not current_user.group_id:
            raise HTTPException(status_code=400, detail="Trainer is not assigned to a group")

        # Force filter by trainer's group
        return query.filter(User.group_id == current_user.group_id).all()

    # 3. Logic for Admin
    if current_user.role == "admin":
        if target_group_id:
            # Filter by the requested group
            return query.filter(User.group_id == target_group_id).all()
        # If no group provided, return all users in the system
        return query.all()

    return []


@app.get("/users/me", response_model=UserOut)
async def read_user_me(
    current_user: User = Depends(get_current_user)
):
    """
    Returns the profile data of the currently authenticated user.
    Available to all roles (Admin, Trainer, Trainee).
    """
    return current_user


# ---  Groups ---

class GroupCreate(BaseModel):
    name: str
    group_image: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    group_image: Optional[str] = None


class GroupOut(BaseModel):
    id: uuid.UUID
    name: str
    group_image: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


# --- Endpoints ---

# 19. Create Group (Admin only)
@app.post("/groups", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(
        group_data: GroupCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create groups")

    # Check if name exists
    existing_group = db.query(Group).filter(Group.name == group_data.name).first()
    if existing_group:
        raise HTTPException(status_code=400, detail="Group name already exists")

    new_group = Group(**group_data.dict())
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group


@app.get("/groups", response_model=List[GroupOut])
async def get_groups(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(Group).all()

    # Non-admins can only see their own group
    if not current_user.group_id:
        raise HTTPException(status_code=404, detail="User is not assigned to any group")

    group = db.query(Group).filter(Group.id == current_user.group_id).all()
    return group


@app.patch("/groups/{group_id}", response_model=GroupOut)
async def update_group(
        group_id: uuid.UUID,
        group_update: GroupUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Authorization Check
    is_admin = current_user.role == "admin"
    is_my_group = (current_user.role == "trainer" and current_user.group_id == group_id)

    if not (is_admin or is_my_group):
        raise HTTPException(status_code=403, detail="Not authorized to update this group")

    update_data = group_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_group, key, value)

    db.commit()
    db.refresh(db_group)
    return db_group


@app.delete("/groups/{group_id}")
async def delete_group(
        group_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete groups")

    db_group = db.query(Group).filter(Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Note: If there are users in this group, you might need to set their group_id to NULL first
    # or handle the integrity error.
    db.delete(db_group)
    db.commit()
    return {"message": "Group deleted successfully"}


# ----- web socket -----


# --- Connection Manager ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[uuid.UUID, WebSocket] = {}

    async def connect(self, user_id: uuid.UUID, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: uuid.UUID):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: uuid.UUID):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_json(message)

    async def broadcast_to_group(self, message: dict, group_id: uuid.UUID, db: Session):
        group_users = db.query(User).filter(User.group_id == group_id).all()
        user_ids_in_group = [u.id for u in group_users]

        for user_id, websocket in self.active_connections.items():
            if user_id in user_ids_in_group:
                await websocket.send_json(message)

manager = ConnectionManager()

import json


# --- WebSocket Implementation ---

@app.websocket("/ws")
async def websocket_endpoint(
        websocket: WebSocket,
        token: str,
        db: Session = Depends(get_db)
):
    # 1. Authenticate user from the token provided in query params
    user_id = None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user = db.query(User).filter(User.username == username).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = user.id
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Connect to the manager
    await manager.connect(user_id, websocket)

    try:
        while True:
            # Wait for incoming messages from the client
            data = await websocket.receive_text()
            message_data = json.loads(data)

            msg_type = message_data.get("type")  # "broadcast" or "private"
            content = message_data.get("content")

            # --- 17. Handle Trainer Broadcast ---
            if msg_type == "broadcast" and user.role == "trainer":
                broadcast_payload = {
                    "from": user.username,
                    "type": "broadcast",
                    "content": content
                }
                await manager.broadcast_to_group(broadcast_payload, user.group_id, db)

            # --- 18. Handle Private Messaging ---
            elif msg_type == "private":
                target_id_str = message_data.get("to_user_id")
                if not target_id_str:
                    continue

                target_id = uuid.UUID(target_id_str)
                target_user = db.query(User).filter(User.id == target_id).first()

                if not target_user:
                    continue

                # Logic check: Trainee can only message their trainer
                if user.role == "trainee" and target_user.role != "trainer":
                    continue

                # Logic check: Trainer can only message users in their group
                if user.role == "trainer" and target_user.group_id != user.group_id:
                    continue

                private_payload = {
                    "from": user.username,
                    "type": "private",
                    "content": content
                }
                await manager.send_personal_message(private_payload, target_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"Error: {e}")
        manager.disconnect(user_id)


if __name__ == "__main__":
    # Get the filename of this script dynamically
    script_name = os.path.basename(__file__).replace(".py", "")
    uvicorn.run(f"{script_name}:app", host="0.0.0.0", port=8000, reload=True)
