from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from app.models.scholarship_model import ScholarshipApplication
    from app.models.career_model import Career


class Student(SQLModel, table=True):
    control_number: str = Field(primary_key=True, max_length=20, index=True)
    full_name: str
    email: str
    phone_number: Optional[str] = None

    # Vinculación estricta a carrera (Integer)
    career_id: Optional[int] = Field(default=None, foreign_key="career.id")

    is_blacklisted: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

    # Relaciones
    # Un estudiante tiene muchas solicitudes (Historial)
    applications: List["ScholarshipApplication"] = Relationship(back_populates="student")

    # Un estudiante pertenece a una carrera
    career_rel: Optional["Career"] = Relationship()