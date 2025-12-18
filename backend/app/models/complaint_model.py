from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class ComplaintType(str, Enum):
    QUEJA = "Queja"
    SUGERENCIA = "Sugerencia"
    AMBAS = "Ambas"


class ComplaintStatus(str, Enum):
    PENDIENTE = "Pendiente"
    EN_REVISION = "En Revisión"
    RESUELTO = "Resuelto"


class Complaint(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Datos del Alumno
    full_name: str
    control_number: str
    phone_number: str
    career: str
    semester: str

    # Detalle del Reporte
    type: ComplaintType
    description: str = Field(max_length=2000)  # Texto largo
    evidence_url: Optional[str] = None

    # Control Interno
    status: ComplaintStatus = Field(default=ComplaintStatus.PENDIENTE)
    created_at: datetime = Field(default_factory=datetime.utcnow)