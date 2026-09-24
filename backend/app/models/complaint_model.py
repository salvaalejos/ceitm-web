from sqlmodel import SQLModel, Field
from sqlmodel.main import NaiveDatetime
from typing import Optional
from enum import Enum
from datetime import datetime


class ComplaintType(str, Enum):
    QUEJA = "Queja"
    SUGERENCIA = "Sugerencia"
    AMBAS = "Ambas"


class ComplaintStatus(str, Enum):
    PENDIENTE = "Pendiente"
    EN_PROCESO = "En Proceso"  # Actualizado para sonar más a "Ticket activo"
    RESUELTO = "Resuelto"
    RECHAZADO = "Rechazado"  # Opcional, por si la queja no procede


class Complaint(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # --- Datos del Alumno (Reportante) ---
    full_name: str
    control_number: str
    phone_number: str
    email: str = Field(index=True)
    career: str
    semester: str

    # --- Detalle del Reporte ---
    type: ComplaintType
    description: str = Field(max_length=2000)
    evidence_url: Optional[str] = None  # Evidencia que sube el alumno

    # --- Sistema de Tickets (NUEVO) ---
    tracking_code: Optional[str] = Field(default=None, index=True, unique=True)  # Ej: CEITM-2025-001

    # --- Resolución por parte del Consejo (NUEVO) ---
    admin_response: Optional[str] = None  # Respuesta oficial
    resolution_evidence_url: Optional[str] = None  # Foto de la solución (Ej: Lámpara reparada)
    resolved_at: Optional[NaiveDatetime] = None  # Fecha de cierre

    # --- Control Interno ---
    status: ComplaintStatus = Field(default=ComplaintStatus.PENDIENTE)
    created_at: NaiveDatetime = Field(default_factory=datetime.utcnow)