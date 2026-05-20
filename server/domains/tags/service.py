import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from core.logger import logger
from .models import Tag, TagCreate


class TagService:
    """
    Service layer executing database transaction logic operations for group-isolated system tags.
    Fully integrated with the mitamnim_server application log and contextual trace pipelines.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_group_tags(self, group_id: uuid.UUID) -> List[Tag]:
        """Retrieves every metadata tag registered flatly inside the designated group perimeter partition."""
        logger.info(f"Querying tags catalog partition tracking metrics for group_id: {group_id}")
        return self.db.query(Tag).filter(Tag.group_id == group_id).all()

    def get_tag_by_id(self, tag_id: int, group_id: uuid.UUID) -> Optional[Tag]:
        """Retrieves a single system tag profile instance while strictly validating group ownership bounds."""
        logger.info(
            f"Fetching tag profile identifier index key: #{tag_id} for verification within group_id: {group_id}")
        return self.db.query(Tag).filter(
            Tag.id == tag_id,
            Tag.group_id == group_id
        ).first()

    def create_tag(self, data: TagCreate, group_id: uuid.UUID) -> Tag:
        """Persists a brand new localized tag token definition record layout attached to the active group context."""
        logger.info(
            f"Executing transactional database append event for new tag: '{data.name}' within group scope: {group_id}")
        new_tag = Tag(
            name=data.name.strip(),
            color=data.color.strip(),
            group_id=group_id
        )
        self.db.add(new_tag)
        self.db.commit()
        self.db.refresh(new_tag)
        logger.info(
            f"Successfully committed and indexed tag asset row inside physical datastore. Generated token ID: #{new_tag.id}")
        return new_tag

    def create_bulk_tags(self, data_list: List[TagCreate], group_id: uuid.UUID) -> List[Tag]:
        """
        Persists a collection array profile of new metadata tags inside a single shared database commit pipeline.
        Utilizes context mapping rules while tracking transaction states over unified logging structures.
        """
        logger.info(
            f"Initiating mass database injection lifecycle sequence for {len(data_list)} metadata tag configurations inside group_id: {group_id}")
        created_tags: List[Tag] = []

        try:
            for item in data_list:
                new_tag = Tag(
                    name=item.name.strip(),
                    color=item.color.strip(),
                    group_id=group_id
                )
                self.db.add(new_tag)
                created_tags.append(new_tag)

            self.db.commit()

            # Refresh every record row state reference following transaction completion
            for created_tag in created_tags:
                self.db.refresh(created_tag)

            logger.info(
                f"Successfully processed batch insert cluster execution. Committed {len(created_tags)} persistent tags to database rows storage context")
            return created_tags

        except Exception as error:
            logger.error(
                f"Bulk data write operation crashed inside tag service perimeter pipeline execution logic. Initializing dynamic transaction rollback sequence",
                exc_info=True)
            self.db.rollback()
            raise error

    def update_tag(self, db_tag: Tag, update_data: dict) -> Tag:
        """Applies validated data array mutations onto a live verified database tag instance row."""
        logger.info(
            f"Initiating attribute mutation lifecycle wrapper on active tag instance entity node ID: #{db_tag.id}")
        for key, value in update_data.items():
            if value is not None and isinstance(value, str):
                value = value.strip()
            setattr(db_tag, key, value)

        self.db.commit()
        self.db.refresh(db_tag)
        logger.info(
            f"Successfully flushed attribute state variations to persistent relational rows for tag node identity ID: #{db_tag.id}")
        return db_tag

    def delete_tag(self, db_tag: Tag):
        """Completely drops a tag record instance row out from physical layout data schemas."""
        logger.warning(
            f"Dispatching complete structural destruction payload sequence targeting tag entity row entry ID: #{db_tag.id}")
        self.db.delete(db_tag)
        self.db.commit()
        logger.info(f"Purge validation sequence finalized successfully. Dropped tag identity index: #{db_tag.id}")