from typing import List, Optional
from sqlalchemy.orm import Session
from core.logger import logger
from .models import Parameter, ParameterCreate


class ParameterService:
    """
    Service layer executing core business logic operations for group metrics.
    Ensures total alignment with the revised parameter type structures during create and update transactions.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_group_parameters(self, group_id) -> List[Parameter]:
        """Retrieves all parameter profiles registered inside a specific group perimeter."""
        logger.info(f"Querying parameters catalog for group_id: {group_id}")
        return self.db.query(Parameter).filter(Parameter.group_id == group_id).all()

    def get_parameter_by_id(self, param_id: int, group_id) -> Optional[Parameter]:
        """Retrieves a single parameter profile by ID while strictly enforcing group ownership bounds."""
        return self.db.query(Parameter).filter(
            Parameter.id == param_id,
            Parameter.group_id == group_id
        ).first()

    def create_parameter(self, data: ParameterCreate, group_id) -> Parameter:
        """Initializes and persists a new parameter record using sanitized Pydantic model configurations."""
        logger.info(f"Creating new parameter: '{data.name}' for group_id: {group_id}")

        new_param = Parameter(
            name=data.name,
            unit=data.unit,
            aggregation_strategy=data.aggregation_strategy,
            group_id=group_id,
            is_virtual=data.is_virtual,
            calculation_type=data.calculation_type,
            source_parameter_ids=data.source_parameter_ids,
            multiplier=data.multiplier
        )

        try:
            self.db.add(new_param)
            self.db.commit()
            self.db.refresh(new_param)
            logger.info(f"Parameter '{new_param.name}' persisted with ID: #{new_param.id}")
            return new_param
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to persist parameter '{data.name}'", exc_info=True)
            raise e

    def update_parameter(self, db_param: Parameter, update_data: dict) -> Parameter:
        """
        Applies discrete attribute mutations onto a target database parameter row.
        Includes automated formula fields resetting if the parameter type changes.
        """
        logger.info(f"Updating parameter ID: #{db_param.id}")

        # If type variations shift the virtual flag from True to False, hard-flush legacy formula bounds
        if "is_virtual" in update_data and not update_data["is_virtual"]:
            update_data["calculation_type"] = None
            update_data["source_parameter_ids"] = None
            update_data["multiplier"] = 1.0

        for key, value in update_data.items():
            setattr(db_param, key, value)

        try:
            self.db.commit()
            self.db.refresh(db_param)
            logger.info(f"Parameter ID: #{db_param.id} updated successfully.")
            return db_param
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update parameter ID: #{db_param.id}", exc_info=True)
            raise e

    def delete_parameter(self, db_param: Parameter):
        """
        Permanently deletes a parameter row and verifies relational integrity.
        Blocks deletion if the parameter is a source for virtual/calculated parameters.
        """
        logger.info(f"Initiating purge sequence for parameter ID: #{db_param.id} (Name: '{db_param.name}')")

        # Check for dependent virtual parameters to prevent structural formula breakdown
        dependents = self.db.query(Parameter).filter(
            Parameter.source_parameter_ids.contains([db_param.id])
        ).all()

        if dependents:
            dependent_names = [p.name for p in dependents]
            logger.error(
                f"Deletion blocked for parameter ID: #{db_param.id}. "
                f"Dependency breach detected in virtual parameters: {dependent_names}"
            )
            raise ValueError(
                f"Cannot delete parameter '{db_param.name}'. "
                f"It is required by the following virtual parameters: {', '.join(dependent_names)}"
            )

        # Proceed with deletion
        try:
            self.db.delete(db_param)
            self.db.commit()
            logger.info(f"Parameter ID: #{db_param.id} purged successfully from database.")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Critical failure during deletion pipeline for parameter ID: #{db_param.id}", exc_info=True)
            raise e