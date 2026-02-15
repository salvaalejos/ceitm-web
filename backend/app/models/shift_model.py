from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from enum import Enum

if TYPE_CHECKING:
    from app.models.user_model import User


class DayOfWeek(str, Enum):
    LUNES = "Lunes"
    MARTES = "Martes"
    MIERCOLES = "Miércoles"
    JUEVES = "Jueves"
    VIERNES = "Viernes"


class Shift(SQLModel, table=True):
    """
    Representa un bloque de guardia asignado.
    Rango de operación: 7:00 AM - 8:00 PM.
    """
    id: Optional[int] = Field(default=None, primary_key=True)

    # El concejal asignado a esta hora
    user_id: int = Field(foreign_key="user.id", index=True)

    day: DayOfWeek
    # Validamos que la hora esté entre las 7 y las 20 (8 PM)
    hour: int = Field(ge=7, le=20, description="Hora de inicio del turno (formato 24h)")

    # Relación
    user: "User" = Relationship(back_populates="shifts")