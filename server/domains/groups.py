import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Session
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status

# Internal infrastructure imports
from db.database import Base, get_db
from middlewares.auth import get_current_user


# --- Database Model ---

class Group(Base):
    """
    SQLAlchemy model representing a Training Group.
    Groups serve as the primary organizational unit for users and data isolation.
    """
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    group_image = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to users (referenced as a string to avoid circular imports)
    users = relationship("User", back_populates="group")


# --- Pydantic Schemas ---

class GroupBase(BaseModel):
    """Base schema for Group data, shared across creation and updates."""
    name: str
    group_image: Optional[str] = None


class GroupCreate(GroupBase):
    """Schema for creating a new group."""
    pass


class GroupUpdate(BaseModel):
    """Schema for partially updating an existing group."""
    name: Optional[str] = None
    group_image: Optional[str] = None


class GroupOut(GroupBase):
    """Schema for outgoing group data, including generated metadata."""
    id: uuid.UUID
    created_at: datetime

    # Pydantic V2 configuration for ORM compatibility
    model_config = ConfigDict(from_attributes=True)


# --- GroupService (Business Logic Class) ---

class GroupService:
    """
    Service layer providing an interface for Group-related database operations.
    Encapsulates CRUD logic away from the API endpoints.
    """

    def __init__(self, db: Session):
        """Initializes the service with a database session."""
        self.db = db

    def get_group_by_id(self, group_id: uuid.UUID) -> Optional[Group]:
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


# --- Router Setup ---

router = APIRouter(prefix="/groups", tags=["Groups"])


@router.post("/", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_new_group(
        group_data: GroupCreate,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Endpoint for creating a new training group.
    Restriction: Only 'admin' users are authorized to create groups.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create groups"
        )

    service = GroupService(db)

    # Validate that the group name is unique
    if service.get_group_by_name(group_data.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group name already exists"
        )

    return service.create_group(group_data)


@router.get("/", response_model=List[GroupOut])
async def get_available_groups(
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Endpoint to retrieve group lists based on user context.
    - Admins: Retrieve all groups.
    - Others: Retrieve only their assigned group.
    """
    service = GroupService(db)

    if current_user.role == "admin":
        return service.get_all_groups()

    # Ensure the user is actually assigned to a group before filtering
    if not current_user.group_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not assigned to any group"
        )

    group = service.get_group_by_id(current_user.group_id)
    return [group] if group else []


@router.patch("/{group_id}", response_model=GroupOut)
async def update_existing_group(
        group_id: uuid.UUID,
        group_update: GroupUpdate,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Endpoint to partially update group details.
    Restriction: Authorized for Admins, or Trainers managing their own group.
    """
    service = GroupService(db)
    db_group = service.get_group_by_id(group_id)

    if not db_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Authorization logic: Admins can update any; Trainers only their own
    is_admin = current_user.role == "admin"
    is_assigned_trainer = (current_user.role == "trainer" and current_user.group_id == group_id)

    if not (is_admin or is_assigned_trainer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this group"
        )

    update_dict = group_update.model_dump(exclude_unset=True)
    return service.update_group(db_group, update_dict)


@router.delete("/{group_id}")
async def remove_group(
        group_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Endpoint for permanent group deletion.
    Restriction: Only 'admin' users can perform this action.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete groups"
        )

    service = GroupService(db)
    db_group = service.get_group_by_id(group_id)

    if not db_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    service.delete_group(db_group)
    return {"message": "Group deleted successfully"}
