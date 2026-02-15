from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from enum import Enum
from datetime import datetime

# Importación para chequeo de tipos evitando ciclos
if TYPE_CHECKING:
    from app.models.user_model import User


class SanctionSeverity(str, Enum):
    LEVE = "Leve"
    NORMAL = "Normal"
    GRAVE = "Grave"


class SanctionStatus(str, Enum):
    PENDIENTE = "Pendiente"
    SALDADA = "Saldada"


class Sanction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Vinculado a la estructura interna (User)
    user_id: int = Field(foreign_key="user.id", index=True)

    severity: SanctionSeverity
    reason: str
    penalty_description: str  # Ejemplo: "$200 MXN" o "4 horas de servicio"

    status: SanctionStatus = Field(default=SanctionStatus.PENDIENTE)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

    # Relación
    user: "User" = Relationship(back_populates="sanctions")