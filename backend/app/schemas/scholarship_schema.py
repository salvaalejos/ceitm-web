from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime
from app.models.scholarship_model import ScholarshipType, ApplicationStatus


# --- CONVOCATORIA (ADMIN) ---
class ScholarshipBase(SQLModel):
    name: str
    type: ScholarshipType
    description: str
    start_date: datetime
    end_date: datetime
    results_date: datetime
    cycle: str
    is_active: bool = True


class ScholarshipCreate(ScholarshipBase):
    pass


class ScholarshipRead(ScholarshipBase):
    id: int


# --- SOLICITUD (ALUMNO PÚBLICO) ---
class ApplicationBase(SQLModel):
    # Ahora enviamos esto manualmente
    full_name: str
    email: str
    control_number: str

    career: str
    semester: str
    phone_number: str

    cle_control_number: Optional[str] = None
    level_to_enter: Optional[str] = None

    address: str
    origin_address: str
    economic_dependence: str
    dependents_count: int
    family_income: float
    income_per_capita: float

    previous_scholarship: Optional[str] = None
    activities: Optional[str] = None
    motivos: str

    # Documentos (URLs)
    doc_request: str
    doc_motivos: str
    doc_address: str
    doc_income: str
    doc_ine: str
    doc_school_id: str
    doc_schedule: Optional[str] = None
    doc_extra: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    scholarship_id: int


class ApplicationRead(ApplicationBase):
    id: int
    # user_id ya no existe
    status: ApplicationStatus
    admin_comments: Optional[str] = None
    created_at: datetime
    scholarship_name: Optional[str] = None