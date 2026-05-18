import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from domains.users.models import User
from .models import Message, MessageCreate, MessageUpdate
from core.logger import logger


class MessageService:
    def __init__(self, db: Session):
        self.db = db

    def get_message_by_id(self, message_id: uuid.UUID) -> Optional[Message]:
        return self.db.query(Message).options(
            joinedload(Message.sender),
            joinedload(Message.recipient)
        ).filter(Message.id == message_id).first()

    def get_messages_for_user(self, user_id: uuid.UUID) -> List[Message]:
        """Get all messages where user is sender or recipient using optimized eager joins."""
        return self.db.query(Message).options(
            joinedload(Message.sender),
            joinedload(Message.recipient)
        ).filter(
            (Message.sender_id == user_id) | (Message.recipient_id == user_id)
        ).order_by(Message.created_at.desc()).all()

    def get_group_messages(self, group_id: uuid.UUID) -> List[Message]:
        """Get all messages for a specific group with sender metadata loaded via join."""
        return self.db.query(Message).options(
            joinedload(Message.sender)
        ).filter(
            Message.group_id == group_id
        ).order_by(Message.created_at.desc()).all()

    def get_personal_messages_between_users(self, user1_id: uuid.UUID, user2_id: uuid.UUID) -> List[Message]:
        """Get personal messages between two users with profile models pre-loaded."""
        return self.db.query(Message).options(
            joinedload(Message.sender),
            joinedload(Message.recipient)
        ).filter(
            ((Message.sender_id == user1_id) & (Message.recipient_id == user2_id)) |
            ((Message.sender_id == user2_id) & (Message.recipient_id == user1_id))
        ).order_by(Message.created_at.asc()).all()

    def create_message(self, message_data: MessageCreate, sender_id: uuid.UUID) -> Message:
        """Persists a new relational communication message record."""
        logger.info(f"User {sender_id} is dispatching a new relational message record.")
        new_message = Message(
            id=uuid.uuid4(),
            sender_id=sender_id,
            **message_data.model_dump()
        )
        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)
        return new_message

    def update_message(self, db_message: Message, update_data: MessageUpdate) -> Message:
        """Applies mutation updates to an existing message thread."""
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(db_message, key, value)
        self.db.commit()
        self.db.refresh(db_message)
        return db_message

    def delete_message(self, db_message: Message):
        logger.info(f"Purging message record instance id: {db_message.id}")
        self.db.delete(db_message)
        self.db.commit()

    def get_main_messages(self, group_id: uuid.UUID) -> List[Message]:
        """Get pinned main/sticky announcements for the group."""
        return self.db.query(Message).options(
            joinedload(Message.sender)
        ).filter(
            Message.group_id == group_id,
            Message.is_main == True
        ).order_by(Message.created_at.desc()).all()

    def get_contacts(self, current_user) -> List[User]:
        """
        Retrieves authorized system contacts leveraging database-level filtering.
        - Trainers/Admins fetch all users inside their group boundaries.
        - Trainees strictly query and retrieve only 'trainer' accounts within their group.
        """
        logger.info(
            f"Querying authorized messaging contact framework registry for user: {current_user.id} ({current_user.role})")

        query = self.db.query(User).filter(User.group_id == current_user.group_id)

        if current_user.role == "trainee":
            # Trainees can only see and contact trainers/coaches in their group
            query = query.filter(User.role == "trainer")
        elif current_user.role == "trainer":
            # Trainers can see everyone in their group except themselves
            query = query.filter(User.id != current_user.id)

        return query.order_by(User.first_name.asc()).all()

    def get_history(self, target_id: uuid.UUID, current_user) -> List[Message]:
        """Get message stream timeline history for a target group channel or direct user contact."""
        from domains.groups.models import Group
        group = self.db.query(Group).filter(Group.id == target_id).first()
        if group and group.id == current_user.group_id:
            return self.get_group_messages(target_id)
        else:
            return self.get_personal_messages_between_users(current_user.id, target_id)