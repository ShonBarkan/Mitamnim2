from typing import List, Optional
from sqlalchemy.orm import Session

from .models import Parameter, ParameterCreate


# --- ParameterService (Business Logic Class) ---

class ParameterService:
    """
    Service layer to handle business logic for measurement parameters.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_group_parameters(self, group_id) -> List[Parameter]:
        """Retrieves all parameters belonging to a specific group."""
        return self.db.query(Parameter).filter(Parameter.group_id == group_id).all()

    def get_parameter_by_id(self, param_id: int, group_id) -> Optional[Parameter]:
        """Retrieves a single parameter by ID while verifying group ownership."""
        return self.db.query(Parameter).filter(
            Parameter.id == param_id,
            Parameter.group_id == group_id
        ).first()

    def create_parameter(self, data: ParameterCreate, group_id) -> Parameter:
        """Initializes and persists a new parameter, including virtual calculation settings."""
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
        self.db.add(new_param)
        self.db.commit()
        self.db.refresh(new_param)
        return new_param

    def update_parameter(self, db_param: Parameter, update_data: dict) -> Parameter:
        """Applies validated updates to a parameter instance."""
        for key, value in update_data.items():
            setattr(db_param, key, value)
        self.db.commit()
        self.db.refresh(db_param)
        return db_param

    def delete_parameter(self, db_param: Parameter):
        """Permanently removes a parameter record."""
        self.db.delete(db_param)
        self.db.commit()
