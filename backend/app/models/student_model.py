from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from app.models.scholarship_model import ScholarshipApplication
    from app.models.career_model import Career


class Student(SQLModel, table=True):
    control_number: str = Field(primary_key=True, max_length=20, index=True)
    full_name: str
    email: str = Field(index=True)
    phone_number: Optional[str] = None

    # --- FIX: Consistencia con otros modelos ---
    # Ahora career es un string, permitiendo el seed y búsquedas rápidas
    career: Optional[str] = None

    # Mantenemos la vinculación estricta por ID
    career_id: Optional[int] = Field(default=None, foreign_key="career.id")

    is_blacklisted: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

    # Relaciones
    applications: List["ScholarshipApplication"] = Relationship(back_populates="student")

    # --- FIX: Renombramos la relación para evitar colisión ---
    career_rel: Optional["Career"] = Relationship()