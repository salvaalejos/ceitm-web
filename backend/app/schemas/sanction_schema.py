from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime
from app.models.sanction_model import SanctionSeverity, SanctionStatus


# --- Schema Mini para mostrar quién fue sancionado ---
class SanctionUserRead(SQLModel):
    id: int
    full_name: str
    area: str
    role: str


# --- BASE ---
class SanctionBase(SQLModel):
    severity: SanctionSeverity
    reason: str
    penalty_description: str  # Ej: "2 Horas de archivo" o "$150"


# --- CREATE (Input del Contralor) ---
class SanctionCreate(SanctionBase):
    user_id: int  # A quién se sanciona


# --- UPDATE (Para corregir o SALDAR) ---
class SanctionUpdate(SQLModel):
    severity: Optional[SanctionSeverity] = None
    reason: Optional[str] = None
    penalty_description: Optional[str] = None
    status: Optional[SanctionStatus] = None


# --- READ (Output al Frontend) ---
class SanctionRead(SanctionBase):
    id: int
    user_id: int
    status: SanctionStatus
    created_at: datetime

    # Datos del usuario sancionado
    user: Optional[SanctionUserRead] = None