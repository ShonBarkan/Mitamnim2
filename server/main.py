import os
import json
import uuid
import uvicorn
from typing import List, Optional, Dict
from datetime import datetime, timedelta

from jose import JWTError, jwt
from dotenv import load_dotenv
from passlib.context import CryptContext
from contextlib import asynccontextmanager
from sqlalchemy.dialects.postgresql import UUID, JSONB
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import sessionmaker, Session, relationship, declarative_base
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, Text, select, update, text
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def scheduled_cleanup():
    # We create a new DB session manually since there is no Request context
    db = SessionLocal()
    try:
        cleanup_old_messages(db)
        print(f"[{datetime.utcnow()}] Scheduled cleanup completed successfully.")
    except Exception as e:
        print(f"[{datetime.utcnow()}] Error during scheduled cleanup: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    scheduler = AsyncIOScheduler()
    # Add job: Run every day at 03:00 AM
    scheduler.add_job(scheduled_cleanup, 'cron', hour=3, minute=0)
    # Alternatively, for testing, run every hour:
    # scheduler.add_job(scheduled_cleanup, 'interval', hours=1)

    scheduler.start()
    print("Starting scheduler...")

    yield

    # Shutdown logic
    scheduler.shutdown()
    print("Shutting down scheduler...")


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
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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

    @field_validator("email", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v


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
    username: Optional[str] = None  # Added this field to allow username updates
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    group_id: Optional[uuid.UUID] = None

    # Validator to convert empty strings to None before Pydantic validation
    @field_validator("email", "username", "first_name", "second_name", "phone", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v


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

    # Pydantic V2 way to handle ORM mapping (replaces class Config)
    model_config = ConfigDict(from_attributes=True)


@app.patch("/users/{user_id}", response_model=UserOut)
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
    # Use model_dump(exclude_unset=True) to get only the fields sent in the request
    update_data = user_update.model_dump(exclude_unset=True)

    # Prevent non-admins from changing sensitive fields (role/group)
    if not is_admin:
        if "role" in update_data or "group_id" in update_data:
            raise HTTPException(
                status_code=403,
                detail="Only admins can update roles or group assignments"
            )

    # 4. Process the update
    if "password" in update_data and update_data["password"]:
        update_data["password"] = get_password_hash(update_data["password"])
    elif "password" in update_data:
        # Remove empty password from update to prevent overwriting with None/empty
        del update_data["password"]

    # Apply changes dynamically
    for key, value in update_data.items():
        setattr(db_user, key, value)

    # 5. Save to DB
    try:
        db.commit()
        db.refresh(db_user)
        # Returning db_user directly. response_model=UserOut will strip the password.
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database update failed: {str(e)}")


@app.get("/users/group", response_model=List[UserOut])
async def get_group_users(
        target_group_id: Optional[uuid.UUID] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Returns a list of users based on roles and permissions:
    - Admins: Can view any group by ID, or all users if no ID is provided.
    - Trainers: Can only view users within their assigned group.
    - Trainees: Can only view users within their own assigned group (to find their trainer).
    """

    query = db.query(User)

    # 1. Admin Logic: Full access or filtered by target_group_id
    if current_user.role == "admin":
        if target_group_id:
            return query.filter(User.group_id == target_group_id).all()
        return query.all()

    # 2. Trainer/Trainee Logic: Restricted to their own group only
    if current_user.role in ["trainer", "trainee"]:
        # Verify the user actually belongs to a group
        if not current_user.group_id:
            raise HTTPException(status_code=400, detail="User is not assigned to any group")

        # If they try to request a different group ID, block them
        if target_group_id and target_group_id != current_user.group_id:
            raise HTTPException(status_code=403, detail="You do not have permission to view this group")

        # Return all users from the user's current group
        return query.filter(User.group_id == current_user.group_id).all()

    # 3. Fallback for unauthorized roles
    raise HTTPException(status_code=403, detail="Role not authorized to view group users")


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

    # Updated for Pydantic V2
    model_config = ConfigDict(from_attributes=True)


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

from typing import Dict, List, Tuple


class ConnectionManager:
    def __init__(self):
        # Store: {user_id: (websocket, group_id, role)}
        self.active_connections: Dict[uuid.UUID, Tuple[WebSocket, Optional[uuid.UUID], str]] = {}

    async def connect(self, user_id: uuid.UUID, websocket: WebSocket, group_id: Optional[uuid.UUID], role: str):
        await websocket.accept()
        self.active_connections[user_id] = (websocket, group_id, role)

    def disconnect(self, user_id: uuid.UUID):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: uuid.UUID):
        if user_id in self.active_connections:
            websocket, _, _ = self.active_connections[user_id]
            await websocket.send_json(message)

    async def broadcast_to_group(self, message: dict, group_id: uuid.UUID):
        """Broadcasts to active group members without DB queries"""
        for user_id, (websocket, user_group, _) in self.active_connections.items():
            if user_group == group_id:
                await websocket.send_json(message)

    async def broadcast_to_admins(self, message: dict):
        """Send notification only to admins"""
        for user_id, (websocket, _, role) in self.active_connections.items():
            if role == "admin":
                await websocket.send_json(message)


manager = ConnectionManager()


# --- WebSocket Implementation ---

@app.websocket("/ws")
async def websocket_endpoint(
        websocket: WebSocket,
        token: str,
        db: Session = Depends(get_db)
):
    """
    Main WebSocket endpoint for real-time notifications and messaging.
    Handles authentication via JWT token passed in query parameters.
    """

    # 1. Authenticate user from the token
    user = None
    try:
        # Decode the JWT token manually as WebSocket doesn't support Depends(get_current_user)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")

        if username is None:
            print("WebSocket Error: Token payload missing 'sub'")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Fetch user from DB based on token payload
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"WebSocket Error: User '{username}' not found in database")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    except Exception as e:
        print(f"WebSocket Authentication Exception: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Register the connection in the manager
    # Passing user_id, websocket, group_id, and role to enable efficient broadcasting
    await manager.connect(
        user_id=user.id,
        websocket=websocket,
        group_id=user.group_id,
        role=user.role
    )

    try:
        while True:
            # Maintain the connection. Ephemeral actions like 'ping' can be handled here.
            data = await websocket.receive_text()

            try:
                message_data = json.loads(data)
                action_type = message_data.get("action")

                if action_type == "ping":
                    await websocket.send_json({"action": "pong"})

            except json.JSONDecodeError:
                # Ignore non-JSON messages to prevent loop crashes
                continue

    except WebSocketDisconnect:
        # Clean cleanup when the client disconnects
        manager.disconnect(user.id)
    except Exception as e:
        # Catch unexpected runtime errors and ensure user is removed from active connections
        print(f"WebSocket Runtime Error for user {user.username}: {e}")
        manager.disconnect(user.id)


# --- Message ---
class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Optional: null for general messages
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Optional: which group is this general message for
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True)

    content = Column(Text, nullable=False)

    # 'general' or 'personal'
    message_type = Column(String, nullable=False)

    # Is this the 'sticky' message for the top panel?
    is_main = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    group = relationship("Group")


class MessageCreate(BaseModel):
    content: str
    message_type: str  # 'general' or 'personal'
    recipient_id: Optional[uuid.UUID] = None
    group_id: Optional[uuid.UUID] = None
    is_main: bool = False


class MessageOut(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: Optional[uuid.UUID] = None
    group_id: Optional[uuid.UUID] = None
    content: str
    message_type: str
    is_main: bool
    created_at: datetime

    # Optional fields to show in UI
    sender_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MessageUpdate(BaseModel):
    content: str


def cleanup_old_messages(db: Session):
    # Calculate the cutoff date (4 days ago)
    cutoff_date = datetime.utcnow() - timedelta(days=4)

    # Delete messages older than the cutoff, that are NOT marked as 'is_main'
    # We usually want to keep main messages even if they are old
    db.query(Message).filter(
        Message.created_at < cutoff_date,
        Message.is_main == False
    ).delete()

    db.commit()


# --- Message Endpoints ---

@app.post("/messages", response_model=MessageOut)
async def create_message(
        message_data: MessageCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # Authorization: Ensure user has a valid role
    if current_user.role not in ["admin", "trainer", "trainee"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Restriction: Only trainers and admins can set 'is_main' (Sticky Banners)
    if message_data.is_main and current_user.role == "trainee":
        raise HTTPException(status_code=403, detail="Trainees cannot set main messages")

    # Restriction: Trainees can only send personal messages to trainers
    if current_user.role == "trainee" and message_data.message_type == "personal":
        recipient = db.query(User).filter(User.id == message_data.recipient_id).first()
        if not recipient or recipient.role != "trainer":
            raise HTTPException(status_code=403, detail="Trainees can only send personal messages to trainers")

    # Handle main message deactivation (ensure only one main message per context)
    if message_data.is_main:
        query = db.query(Message).filter(Message.is_main == True)
        if message_data.message_type == "general":
            query = query.filter(Message.group_id == message_data.group_id)
        else:
            query = query.filter(Message.recipient_id == message_data.recipient_id)
        query.update({Message.is_main: False})

    # Create the message with a manual UUID (to sync with logic that uses UUIDs)
    new_message = Message(
        id=uuid.uuid4(),
        sender_id=current_user.id,
        recipient_id=message_data.recipient_id,
        group_id=message_data.group_id,
        content=message_data.content,
        message_type=message_data.message_type,
        is_main=message_data.is_main,
        created_at=datetime.utcnow()
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    new_message.sender_name = f"{current_user.first_name} {current_user.second_name}"

    # Prepare WebSocket Payload
    payload = {
        "action": "MESSAGE_CREATED",
        "data": {
            "id": str(new_message.id),
            "content": new_message.content,
            "sender_name": new_message.sender_name,
            "sender_id": str(new_message.sender_id),
            "message_type": new_message.message_type,
            "is_main": new_message.is_main,
            "recipient_id": str(new_message.recipient_id) if new_message.recipient_id else None,
            "group_id": str(new_message.group_id) if new_message.group_id else None,
            "created_at": new_message.created_at.isoformat()
        }
    }

    # Broadcast via WebSocket
    if new_message.message_type == "general":
        await manager.broadcast_to_group(payload, new_message.group_id)
    else:
        # Send to recipient and sender for multi-tab synchronization
        await manager.send_personal_message(payload, new_message.recipient_id)
        await manager.send_personal_message(payload, new_message.sender_id)

    return new_message


@app.patch("/messages/{message_id}", response_model=MessageOut)
async def update_message(
        message_id: uuid.UUID,
        message_update: MessageUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # RULE: Users can only update messages they authored
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own messages")

    message.content = message_update.content
    db.commit()
    db.refresh(message)

    # Sync sender name for UI
    message.sender_name = f"{current_user.first_name} {current_user.second_name}"

    # Notify via WebSocket
    payload = {
        "action": "MESSAGE_UPDATED",
        "data": {
            "id": str(message.id),
            "content": message.content,
            "message_type": message.message_type,
            "group_id": str(message.group_id) if message.group_id else None,
            "recipient_id": str(message.recipient_id) if message.recipient_id else None,
            "sender_id": str(message.sender_id)
        }
    }

    if message.message_type == "general":
        await manager.broadcast_to_group(payload, message.group_id)
    else:
        await manager.send_personal_message(payload, message.recipient_id)
        await manager.send_personal_message(payload, message.sender_id)

    return message


@app.delete("/messages/{message_id}")
async def delete_message(
        message_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # RULES: Owners can delete their own. Trainers and Admins can delete anyone's.
    is_owner = message.sender_id == current_user.id
    is_privileged = current_user.role in ["trainer", "admin"]

    if not (is_owner or is_privileged):
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")

    # Cache details for WebSocket notification before deletion
    msg_id_str = str(message.id)
    msg_type = message.message_type
    group_id = message.group_id
    recipient_id = message.recipient_id
    sender_id = message.sender_id

    db.delete(message)
    db.commit()

    # Notify via WebSocket
    payload = {
        "action": "MESSAGE_DELETED",
        "data": {
            "id": msg_id_str,
            "message_type": msg_type,
            "group_id": str(group_id) if group_id else None,
            "recipient_id": str(recipient_id) if recipient_id else None,
            "sender_id": str(sender_id)
        }
    }

    if msg_type == "general":
        await manager.broadcast_to_group(payload, group_id)
    else:
        await manager.send_personal_message(payload, recipient_id)
        await manager.send_personal_message(payload, sender_id)

    return {"message": "Deleted successfully"}


@app.get("/messages/main", response_model=List[MessageOut])
async def get_main_messages(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Returns active sticky (main) messages for the user's context.
    """
    main_messages = []

    # 1. Group sticky message
    if current_user.group_id:
        general_main = db.query(Message).filter(
            Message.group_id == current_user.group_id,
            Message.message_type == "general",
            Message.is_main == True
        ).order_by(Message.created_at.desc()).first()

        if general_main:
            sender = db.query(User).filter(User.id == general_main.sender_id).first()
            general_main.sender_name = f"{sender.first_name} {sender.second_name}" if sender else "Unknown"
            main_messages.append(general_main)

    # 2. Personal sticky message (mostly for trainees)
    personal_main = db.query(Message).filter(
        Message.recipient_id == current_user.id,
        Message.message_type == "personal",
        Message.is_main == True
    ).order_by(Message.created_at.desc()).first()

    if personal_main:
        sender = db.query(User).filter(User.id == personal_main.sender_id).first()
        personal_main.sender_name = f"{sender.first_name} {sender.second_name}" if sender else "Unknown"
        main_messages.append(personal_main)

    return main_messages


@app.get("/messages/history/{target_id}", response_model=List[MessageOut])
async def get_message_history(
        target_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Fetches historical messages for a group or a private chat.
    """
    # Try fetching as a group first
    group = db.query(Group).filter(Group.id == target_id).first()

    if group:
        # Permission: user must be admin or member of the group
        if current_user.role != "admin" and current_user.group_id != group.id:
            raise HTTPException(status_code=403, detail="Access denied to group history")

        messages = db.query(Message).filter(
            Message.group_id == target_id,
            Message.message_type == "general"
        ).order_by(Message.created_at.asc()).all()

    else:
        # Assume it's a private user chat
        target_user = db.query(User).filter(User.id == target_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target not found")

        messages = db.query(Message).filter(
            Message.message_type == "personal",
            ((Message.sender_id == current_user.id) & (Message.recipient_id == target_id)) |
            ((Message.sender_id == target_id) & (Message.recipient_id == current_user.id))
        ).order_by(Message.created_at.asc()).all()

    # Enrich sender names
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        msg.sender_name = f"{sender.first_name} {sender.second_name}" if sender else "Unknown"

    return messages


# --- Parameter Model (Database Table) ---
class Parameter(Base):
    __tablename__ = "parameters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)


# --- Parameter Schemas (Pydantic Models) ---
class ParameterBase(BaseModel):
    name: str
    unit: str
    group_id: uuid.UUID


class ParameterCreate(ParameterBase):
    pass


class ParameterUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None


class ParameterOut(ParameterBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# --- Parameter Routes ---
@app.get("/parameters", response_model=List[ParameterOut])
async def get_parameters(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # Filter by current_user.group_id to ensure users only see their group's parameters
    return db.query(Parameter).filter(
        Parameter.group_id == current_user.group_id
    ).all()


@app.post("/parameters", response_model=ParameterOut)
async def create_parameter(
        param_data: ParameterCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # Only trainers and admins can define new measurement parameters
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to create parameters"
        )

    # Manual injection of group_id from the authenticated user
    # This solves the NotNullViolation error
    new_param = Parameter(**param_data.dict())
    new_param.group_id = current_user.group_id

    db.add(new_param)
    db.commit()
    db.refresh(new_param)
    return new_param


@app.patch("/parameters/{param_id}", response_model=ParameterOut)
async def update_parameter(
        param_id: int,
        param_update: ParameterUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update parameters"
        )

    # Verify both the ID and that it belongs to the user's group
    db_param = db.query(Parameter).filter(
        Parameter.id == param_id,
        Parameter.group_id == current_user.group_id
    ).first()

    if not db_param:
        raise HTTPException(
            status_code=404,
            detail="Parameter not found or access denied"
        )

    update_data = param_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_param, key, value)

    db.commit()
    db.refresh(db_param)
    return db_param


@app.delete("/parameters/{param_id}")
async def delete_parameter(
        param_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete parameters"
        )

    # Verify ownership before deletion to prevent cross-group attacks
    db_param = db.query(Parameter).filter(
        Parameter.id == param_id,
        Parameter.group_id == current_user.group_id
    ).first()

    if not db_param:
        raise HTTPException(
            status_code=404,
            detail="Parameter not found or access denied"
        )

    db.delete(db_param)
    db.commit()
    return {"message": "Parameter deleted successfully"}


# --- Exercise Tree Model ---
class ExerciseTree(Base):
    __tablename__ = "exercise_tree"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)

    # Relationship to allow navigation between parent and children
    # (Optional, but useful for advanced queries)


# --- Exercise Tree Schemas ---
class ExerciseBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    group_id: uuid.UUID


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None


class ExerciseOut(ExerciseBase):
    id: int
    has_children: bool = False
    has_params: bool = False

    model_config = ConfigDict(from_attributes=True)


# --- Exercise Tree Routes ---

@app.get("/exercises", response_model=List[ExerciseOut])
async def get_exercises(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # Fetch exercises for the group
    exercises = db.query(ExerciseTree).filter(
        ExerciseTree.group_id == current_user.group_id
    ).all()

    # Convert to Pydantic and check for relations
    results = []
    for ex in exercises:
        # Check if this node is a parent to others
        child_exists = db.query(ExerciseTree).filter(ExerciseTree.parent_id == ex.id).first() is not None
        # Check if this node has active parameters
        params_exist = db.query(ActiveParam).filter(ActiveParam.exercise_id == ex.id).first() is not None

        ex_out = ExerciseOut.from_orm(ex)
        ex_out.has_children = child_exists
        ex_out.has_params = params_exist
        results.append(ex_out)

    return results


@app.post("/exercises", response_model=ExerciseOut)
async def create_exercise(
        exercise_data: ExerciseCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Business Rule: If adding a sub-exercise, ensure parent has NO active parameters
    if exercise_data.parent_id:
        parent_has_params = db.query(ActiveParam).filter(
            ActiveParam.exercise_id == exercise_data.parent_id
        ).first()

        if parent_has_params:
            raise HTTPException(
                status_code=400,
                detail="Cannot add sub-exercises to an exercise that already has measurement parameters."
            )

    new_node = ExerciseTree(**exercise_data.dict())
    new_node.group_id = current_user.group_id
    db.add(new_node)
    db.commit()
    db.refresh(new_node)
    return new_node


@app.patch("/exercises/{exercise_id}", response_model=ExerciseOut)
async def update_exercise(
        exercise_id: int,
        exercise_update: ExerciseUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to modify exercise tree"
        )

    # Security: Find the node and verify it belongs to the current user's group
    db_node = db.query(ExerciseTree).filter(
        ExerciseTree.id == exercise_id,
        ExerciseTree.group_id == current_user.group_id
    ).first()

    if not db_node:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found or does not belong to your group"
        )

    # Apply updates
    data = exercise_update.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(db_node, key, value)

    db.commit()
    db.refresh(db_node)
    return db_node


@app.delete("/exercises/{exercise_id}")
async def delete_exercise(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to modify exercise tree"
        )

    # Security: Verify ownership before deleting
    # The 'ON DELETE CASCADE' in the DB will automatically handle child nodes
    db_node = db.query(ExerciseTree).filter(
        ExerciseTree.id == exercise_id,
        ExerciseTree.group_id == current_user.group_id
    ).first()

    if not db_node:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found or does not belong to your group"
        )

    db.delete(db_node)
    db.commit()
    return {"message": "Exercise deleted successfully"}


@app.get("/exercises/{exercise_id}/active-params")
def get_exercise_active_params(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Fetches all active parameters associated with a specific exercise ID.
    Uses the 'active_params' junction table to link 'parameters' and 'exercise_tree'.
    """

    # SQL query using the exact table names from your database schema
    query = text("""
        SELECT 
            p.id as parameter_id,
            p.name as parameter_name,
            p.unit as parameter_unit,
            ap.default_value
        FROM parameters p
        JOIN active_params ap ON p.id = ap.parameter_id
        WHERE ap.exercise_id = :ex_id
    """)

    try:
        # Executing the query with the exercise_id parameter
        results = db.execute(query, {"ex_id": exercise_id}).mappings().all()

        # Return empty list if no parameters are found to prevent frontend errors
        return list(results)

    except Exception as e:
        # Log the error for debugging
        print(f"Database error in get_exercise_active_params: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching parameters")


# --- Exercise Parameters Endpoints ---


# --- Active Parameter Model ---
class ActiveParam(Base):
    __tablename__ = "active_params"

    id = Column(Integer, primary_key=True, index=True)
    parameter_id = Column(Integer, ForeignKey("parameters.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    default_value = Column(Text, nullable=True)

    # Relationships for easier data access
    parameter = relationship("Parameter")
    exercise = relationship("ExerciseTree")


# --- Active Parameter Schemas ---
class ActiveParamBase(BaseModel):
    parameter_id: int
    exercise_id: int
    group_id: uuid.UUID
    default_value: Optional[str] = None


class ActiveParamCreate(ActiveParamBase):
    pass


class ActiveParamOut(ActiveParamBase):
    id: int
    # These fields will be populated manually or via joins to show names in UI
    parameter_name: Optional[str] = None
    parameter_unit: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Active Parameter Routes ---

@app.get("/active-params/{exercise_id}", response_model=List[ActiveParamOut])
async def get_active_params_for_exercise(
        exercise_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Fetch all parameters linked to a specific exercise.
    Filters by the user's group_id to ensure data isolation.
    """
    # We join with Parameter table to get name and unit in one query
    results = db.query(ActiveParam).join(Parameter).filter(
        ActiveParam.exercise_id == exercise_id,
        ActiveParam.group_id == current_user.group_id
    ).all()

    # Manually populate the 'Out' schema fields from the joined relationship
    for r in results:
        r.parameter_name = r.parameter.name
        r.parameter_unit = r.parameter.unit

    return results


@app.post("/active-params", response_model=ActiveParamOut)
async def link_parameter_to_exercise(
        data: ActiveParamCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Business Rule: Ensure target exercise has NO sub-exercises
    has_children = db.query(ExerciseTree).filter(
        ExerciseTree.parent_id == data.exercise_id
    ).first()

    if has_children:
        raise HTTPException(
            status_code=400,
            detail="Cannot link parameters to a category exercise that has sub-exercises."
        )

    # Standard security & creation logic
    if data.group_id != current_user.group_id:
        raise HTTPException(status_code=403, detail="Group mismatch")

    new_link = ActiveParam(**data.dict())
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    return new_link


@app.delete("/active-params/{link_id}")
async def unlink_parameter(
        link_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Removes a parameter link. Verified by group ownership.
    """
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Not authorized to unlink parameters")

    # Find the link and ensure it belongs to the user's group
    db_link = db.query(ActiveParam).filter(
        ActiveParam.id == link_id,
        ActiveParam.group_id == current_user.group_id
    ).first()

    if not db_link:
        raise HTTPException(status_code=404, detail="Link not found or doesn't belong to your group")

    db.delete(db_link)
    db.commit()
    return {"message": "Parameter successfully unlinked from exercise"}


# --- Activity Log Model ---
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # This now works because WorkoutSession is defined above
    workout_session_id = Column(
        Integer,
        ForeignKey("workout_sessions.id", ondelete="SET NULL"),
        nullable=True  # Allows NULL as requested
    )

    timestamp = Column(DateTime, default=datetime.utcnow)
    performance_data = Column(JSONB, nullable=False)

    # Relationships
    exercise = relationship("ExerciseTree")
    user = relationship("User")
    # Added relationship for easier access later if needed
    workout_session = relationship("WorkoutSession")


# --- Activity Log Schemas ---

class PerformanceEntry(BaseModel):
    parameter_id: int
    parameter_name: str
    unit: str
    value: str


class ActivityLogBase(BaseModel):
    exercise_id: int
    performance_data: List[PerformanceEntry]
    workout_session_id: Optional[int] = None


class ActivityLogCreate(ActivityLogBase):
    pass


class ActivityLogOut(ActivityLogBase):
    id: int
    user_id: uuid.UUID
    timestamp: datetime
    exercise_name: Optional[str] = None
    user_full_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Activity Log Update Schema ---
class ActivityLogUpdate(BaseModel):
    timestamp: Optional[datetime] = None
    performance_data: Optional[List[PerformanceEntry]] = None

    model_config = ConfigDict(from_attributes=True)


# --- Activity Log Routes ---

@app.post("/activity-logs", response_model=ActivityLogOut)
async def create_log(data: ActivityLogCreate, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    new_log = ActivityLog(**data.dict())
    new_log.user_id = current_user.id
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@app.get("/activity-logs/{exercise_id}", response_model=List[ActivityLogOut])
async def get_logs(exercise_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Recursive helper to get all child exercise IDs
    def get_all_ids(p_id):
        ids = [p_id]
        children = db.query(ExerciseTree.id).filter(ExerciseTree.parent_id == p_id).all()
        for c_id, in children:
            ids.extend(get_all_ids(c_id))
        return ids

    target_ids = get_all_ids(exercise_id)
    logs = db.query(ActivityLog).filter(
        ActivityLog.exercise_id.in_(target_ids),
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.timestamp.desc()).all()

    for log in logs:
        log.exercise_name = log.exercise.name
    return logs


@app.delete("/activity-logs/{log_id}")
async def delete_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(ActivityLog).filter(ActivityLog.id == log_id, ActivityLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"status": "deleted"}


@app.patch("/activity-logs/{log_id}", response_model=ActivityLogOut)
async def update_activity_log(
        log_id: int,
        log_update: ActivityLogUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # Security check: Ensure the log exists and belongs to the current user
    db_log = db.query(ActivityLog).filter(
        ActivityLog.id == log_id,
        ActivityLog.user_id == current_user.id
    ).first()

    if not db_log:
        raise HTTPException(status_code=404, detail="Log entry not found or unauthorized")

    # Update fields if provided
    update_data = log_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_log, key, value)

    db.commit()
    db.refresh(db_log)

    # Manual population of exercise name for the response
    db_log.exercise_name = db_log.exercise.name
    return db_log


class WorkoutTemplate(Base):
    __tablename__ = "workout_templates"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    parent_exercise_id = Column(Integer, ForeignKey("exercise_tree.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    exercises_config = Column(JSONB, nullable=False)
    for_users = Column(JSONB, server_default='[]')
    scheduled_days = Column(JSONB, server_default='[]')
    expected_duration_time = Column(String, nullable=True)
    scheduled_hour = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    group = relationship("Group")
    parent_exercise = relationship("ExerciseTree")


class ParamInExercise(BaseModel):
    parameter_id: int
    parameter_name: str
    parameter_unit: str
    value: str


class ExerciseInTemplate(BaseModel):
    exercise_id: int
    exercise_name: str
    num_of_sets: int
    params: List[ParamInExercise]


class WorkoutTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_exercise_id: Optional[int] = None
    exercises_config: List[ExerciseInTemplate]
    for_users: List[uuid.UUID] = []
    scheduled_days: List[int] = []
    expected_duration_time: Optional[str] = None
    scheduled_hour: Optional[str] = None


class WorkoutTemplateCreate(WorkoutTemplateBase):
    pass


class WorkoutTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_exercise_id: Optional[int] = None
    exercises_config: Optional[List[ExerciseInTemplate]] = None
    for_users: Optional[List[uuid.UUID]] = None
    scheduled_days: Optional[List[int]] = None
    expected_duration_time: Optional[str] = None
    scheduled_hour: Optional[str] = None


class WorkoutTemplateOut(WorkoutTemplateBase):
    id: int
    group_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Workout Templates Endpoints ---

@app.post("/workout-templates", response_model=WorkoutTemplateOut)
def create_workout_template(
        template: WorkoutTemplateCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Only trainers can create templates")

    users_list = [str(u) for u in template.for_users]

    db_template = WorkoutTemplate(
        group_id=current_user.group_id,
        parent_exercise_id=template.parent_exercise_id,
        name=template.name,
        description=template.description,
        # Serialize the nested model structure into JSONB
        exercises_config=[item.model_dump() for item in template.exercises_config],
        for_users=users_list,
        scheduled_days=template.scheduled_days,
        expected_duration_time=template.expected_duration_time,
        scheduled_hour=template.scheduled_hour
    )

    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@app.get("/workout-templates", response_model=List[WorkoutTemplateOut])
def get_workout_templates(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    query = db.query(WorkoutTemplate).filter(WorkoutTemplate.group_id == current_user.group_id)
    all_group_templates = query.all()

    if current_user.role in ['trainer', 'admin']:
        return all_group_templates

    accessible_templates = []
    user_id_str = str(current_user.id)

    for tmpl in all_group_templates:
        if not tmpl.for_users or len(tmpl.for_users) == 0 or user_id_str in tmpl.for_users:
            accessible_templates.append(tmpl)

    return accessible_templates


@app.patch("/workout-templates/{template_id}", response_model=WorkoutTemplateOut)
def update_workout_template(
        template_id: int,
        template_data: WorkoutTemplateUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    db_template = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id).first()

    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    if current_user.role not in ['trainer', 'admin'] or db_template.group_id != current_user.group_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this template")

    update_dict = template_data.model_dump(exclude_unset=True)

    # Special handling for serialized lists/JSONB fields
    if "exercises_config" in update_dict:
        update_dict["exercises_config"] = [item.model_dump() for item in template_data.exercises_config]

    if "for_users" in update_dict:
        update_dict["for_users"] = [str(u) for u in template_data.for_users]

    for key, value in update_dict.items():
        setattr(db_template, key, value)

    db.commit()
    db.refresh(db_template)
    return db_template


@app.delete("/workout-templates/{template_id}")
def delete_workout_template(
        template_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    db_template = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id).first()

    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    if current_user.role not in ['trainer', 'admin'] or db_template.group_id != current_user.group_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this template")

    db.delete(db_template)
    db.commit()
    return {"detail": "Template deleted successfully"}


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Session, relationship
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timedelta
from typing import List, Optional, Dict
import uuid


# --- DATABASE MODELS (SQLAlchemy) ---


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    workout_summary = Column(Text, nullable=True)
    actual_duration = Column(String, nullable=True)
    notes = Column(Text, nullable=True)


class WorkoutTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_exercise_id: Optional[int] = None
    exercises_config: List[ExerciseInTemplate]
    for_users: List[uuid.UUID] = []
    scheduled_days: List[int] = []
    expected_duration_time: Optional[str] = None
    scheduled_hour: Optional[str] = None


class WorkoutTemplateCreate(WorkoutTemplateBase):
    pass


class WorkoutTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    exercises_config: Optional[List[ExerciseInTemplate]] = None
    for_users: Optional[List[uuid.UUID]] = None
    scheduled_days: Optional[List[int]] = None
    expected_duration_time: Optional[str] = None
    scheduled_hour: Optional[str] = None


class WorkoutTemplateOut(WorkoutTemplateBase):
    id: int
    group_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Session Schemas
class PerformedExerciseSchema(BaseModel):
    exercise_id: int
    performance_data: Dict[str, str]


class WorkoutSessionFinish(BaseModel):
    template_id: Optional[int] = None
    start_time: datetime
    workout_summary: Optional[str] = None
    actual_duration: Optional[str] = None
    performed_exercises: List[PerformedExerciseSchema]


class WorkoutSessionOut(BaseModel):
    id: int
    user_id: uuid.UUID
    start_time: datetime
    end_time: Optional[datetime]
    workout_summary: Optional[str]
    actual_duration: Optional[str]
    model_config = ConfigDict(from_attributes=True)


# --- ENDPOINTS (CRUD) ---

router = APIRouter(tags=["Workout Management"])


# 1. CREATE Template
@router.post("/workout-templates", response_model=WorkoutTemplateOut)
def create_template(template: WorkoutTemplateCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    if current_user.role not in ['trainer', 'admin']:
        raise HTTPException(status_code=403, detail="Unauthorized")

    db_template = WorkoutTemplate(
        group_id=current_user.group_id,
        parent_exercise_id=template.parent_exercise_id,
        name=template.name,
        description=template.description,
        exercises_config=[ex.model_dump() for ex in template.exercises_config],
        for_users=[str(u) for u in template.for_users],
        scheduled_days=template.scheduled_days,
        expected_duration_time=template.expected_duration_time,
        scheduled_hour=template.scheduled_hour
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


# 2. GET All Templates (with Group & User filtering)
@router.get("/workout-templates", response_model=List[WorkoutTemplateOut])
def get_templates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    all_group_templates = db.query(WorkoutTemplate).filter(WorkoutTemplate.group_id == current_user.group_id).all()

    if current_user.role in ['trainer', 'admin']:
        return all_group_templates

    # Filter for trainees: empty for_users OR user_id is in for_users
    user_id_str = str(current_user.id)
    return [t for t in all_group_templates if not t.for_users or user_id_str in t.for_users]


# 3. UPDATE Template (Partial)
@router.patch("/workout-templates/{template_id}", response_model=WorkoutTemplateOut)
def update_template(template_id: int, template_data: WorkoutTemplateUpdate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    db_template = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id).first()
    if not db_template or db_template.group_id != current_user.group_id:
        raise HTTPException(status_code=404, detail="Template not found")

    update_dict = template_data.model_dump(exclude_unset=True)
    if "exercises_config" in update_dict:
        update_dict["exercises_config"] = [ex.model_dump() for ex in template_data.exercises_config]
    if "for_users" in update_dict:
        update_dict["for_users"] = [str(u) for u in template_data.for_users]

    for key, value in update_dict.items():
        setattr(db_template, key, value)

    db.commit()
    db.refresh(db_template)
    return db_template


# 4. DELETE Template
@router.delete("/workout-templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_template = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id).first()
    if not db_template or db_template.group_id != current_user.group_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    db.delete(db_template)
    db.commit()
    return {"detail": "Template deleted"}


# 5. FINISH Workout (Create Session + Incremental Logs)
@router.post("/workout-sessions/finish", response_model=WorkoutSessionOut)
def finish_workout(session_data: WorkoutSessionFinish, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    # Create the master session
    db_session = WorkoutSession(
        user_id=current_user.id,
        template_id=session_data.template_id,
        start_time=session_data.start_time,
        end_time=datetime.utcnow(),
        workout_summary=session_data.workout_summary,
        actual_duration=session_data.actual_duration
    )
    db.add(db_session)
    db.flush()

    # Create activity logs with 1-minute increments
    current_log_time = session_data.start_time
    for exercise in session_data.performed_exercises:
        current_log_time += timedelta(minutes=1)
        log = ActivityLog(
            exercise_id=exercise.exercise_id,
            user_id=current_user.id,
            workout_session_id=db_session.id,
            timestamp=current_log_time,
            performance_data=exercise.performance_data
        )
        db.add(log)

    db.commit()
    db.refresh(db_session)
    return db_session


# 6. GET Workout History
@router.get("/workout-sessions/history", response_model=List[WorkoutSessionOut])
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(WorkoutSession).filter(WorkoutSession.user_id == current_user.id).order_by(
        WorkoutSession.start_time.desc()).all()


if __name__ == "__main__":
    # Get the filename of this script dynamically
    script_name = os.path.basename(__file__).replace(".py", "")
    uvicorn.run(f"{script_name}:app", host="0.0.0.0", port=8000, reload=True)
