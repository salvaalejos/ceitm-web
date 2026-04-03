from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
# CORRECCIÓN: Importamos date y time con un alias para evitar el choque de nombres
from datetime import datetime, date as date_type, time as time_type
from enum import Enum

# Evitamos ciclos de importación
if TYPE_CHECKING:
    from app.models.student_model import Student
    from app.models.user_model import User


class AttendanceStatus(str, Enum):
    PRESENTE = "presente"
    FALTA = "falta"
    JUSTIFICADO = "justificado"


class Attendance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Relación con el becario
    student_id: str = Field(foreign_key="student.control_number", index=True)

    # CORRECCIÓN: Usamos date_type y pasamos la función real hoy (date_type.today)
    date: date_type = Field(default_factory=date_type.today, index=True)
    time_in: Optional[time_type] = Field(default=None)

    status: AttendanceStatus = Field(default=AttendanceStatus.PRESENTE)

    # ¿Quién registró la asistencia manualmente? (Coordinador o Vocal)
    registered_by_id: Optional[int] = Field(default=None, foreign_key="user.id")

    # --- PREPARACIÓN PARA NFC (Futuro) ---
    nfc_uid_scanned: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relaciones
    student: Optional["Student"] = Relationship(back_populates="attendances")
    registered_by: Optional["User"] = Relationship()