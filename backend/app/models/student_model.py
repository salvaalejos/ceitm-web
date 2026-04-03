from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from app.models.scholarship_model import ScholarshipApplication
    from app.models.career_model import Career
    from app.models.attendance_model import Attendance


class Student(SQLModel, table=True):
    control_number: str = Field(primary_key=True, max_length=20, index=True)
    full_name: str
    email: str = Field(index=True)
    phone_number: Optional[str] = None

    # SOLO DEJAMOS LA LLAVE FORÁNEA (CORRECCIÓN CRÍTICA)
    career_id: Optional[int] = Field(default=None, foreign_key="career.id")

    is_blacklisted: bool = Field(default=False)

    # Identificador único de la tarjeta física asignada al becario
    nfc_uid: Optional[str] = Field(default=None, index=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

    # Relaciones
    applications: List["ScholarshipApplication"] = Relationship(back_populates="student")

    # Renombramos para claridad en el backend
    career_rel: Optional["Career"] = Relationship()

    attendances: List["Attendance"] = Relationship(back_populates="student")