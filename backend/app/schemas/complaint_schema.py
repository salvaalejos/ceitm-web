from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime
from app.models.complaint_model import ComplaintType, ComplaintStatus


# --- Base (Campos comunes) ---
class ComplaintBase(SQLModel):
    full_name: str
    control_number: str
    phone_number: str
    email: str
    career: str
    semester: str
    type: ComplaintType
    description: str
    evidence_url: Optional[str] = None


# --- Para crear una nueva queja (Input del Alumno) ---
class ComplaintCreate(ComplaintBase):
    pass
    # Nota: No incluimos tracking_code aquí porque se genera en el backend automáticamente.


# --- Para resolver una queja (Input del Admin) ---
class ComplaintResolve(SQLModel):
    status: ComplaintStatus
    admin_response: str
    resolution_evidence_url: Optional[str] = None


# --- Para leer/devolver datos (Output al Frontend) ---
class ComplaintRead(ComplaintBase):
    id: int
    status: ComplaintStatus
    created_at: datetime

    # Nuevos campos de rastreo
    tracking_code: Optional[str] = None
    admin_response: Optional[str] = None
    resolution_evidence_url: Optional[str] = None
    resolved_at: Optional[datetime] = None


# --- Para actualizar estatus genérico (Opcional) ---
class ComplaintUpdate(SQLModel):
    status: Optional[ComplaintStatus] = None