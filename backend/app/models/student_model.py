from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from app.models.scholarship_model import ScholarshipApplication
    from app.models.career_model import Career


class Student(SQLModel, table=True):
    # La llave primaria es el número de control (String)
    control_number: str = Field(primary_key=True, max_length=20, index=True)

    full_name: str
    email: str = Field(index=True)
    phone_number: Optional[str] = None

    # --- CAMBIO SOLICITADO: Vinculación estricta por ID ---
    career_id: Optional[int] = Field(default=None, foreign_key="career.id")

    # Campo Crítico para la funcionalidad de Blacklist
    is_blacklisted: bool = Field(default=False)

    # Auditoría básica
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

    # Relaciones
    # 1. Un estudiante tiene muchas solicitudes
    applications: List["ScholarshipApplication"] = Relationship(back_populates="student")
    # 2. Un estudiante pertenece a una carrera
    career: Optional["Career"] = Relationship()