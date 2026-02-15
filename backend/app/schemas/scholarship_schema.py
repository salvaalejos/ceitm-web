from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
from pydantic import field_validator, model_validator
from app.models.scholarship_model import ScholarshipType, ApplicationStatus, ScholarshipPeriod


# --- 1. SCHEMAS PARA CUPOS (QUOTAS) ---
class ScholarshipQuotaBase(SQLModel):
    career_name: str
    total_slots: int


class ScholarshipQuotaCreate(ScholarshipQuotaBase):
    pass


class ScholarshipQuotaUpdate(SQLModel):
    total_slots: int


class ScholarshipQuotaRead(ScholarshipQuotaBase):
    id: int
    scholarship_id: int
    used_slots: int
    available_slots: int

    @field_validator('available_slots', mode='before', check_fields=False)
    @classmethod
    def calculate_available(cls, v, values):
        if v is not None:
            return v
        data = values.data
        return data.get('total_slots', 0) - data.get('used_slots', 0)


# --- 2. CONVOCATORIA (ADMIN) ---
class ScholarshipBase(SQLModel):
    name: str
    type: ScholarshipType
    description: str
    start_date: datetime
    end_date: datetime
    results_date: datetime

    # Configuración de Folios
    year: int
    period: ScholarshipPeriod
    folio_identifier: str = Field(max_length=50)

    is_active: bool = True


class ScholarshipCreate(ScholarshipBase):
    pass


class ScholarshipRead(ScholarshipBase):
    id: int
    quotas: List[ScholarshipQuotaRead] = []


class ScholarshipUpdate(SQLModel):
    name: Optional[str] = None
    type: Optional[ScholarshipType] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    results_date: Optional[datetime] = None

    year: Optional[int] = None
    period: Optional[ScholarshipPeriod] = None
    folio_identifier: Optional[str] = None

    is_active: Optional[bool] = None


# --- 3. SOLICITUD (ALUMNO PÚBLICO) ---
class ApplicationBase(SQLModel):
    # Datos Personales
    full_name: str
    email: str
    control_number: str
    phone_number: str
    career: str
    semester: str

    # FOTO OBLIGATORIA
    student_photo: str

    # Específicos
    cle_control_number: Optional[str] = None
    level_to_enter: Optional[str] = None

    # Académicos
    arithmetic_average: float
    certified_average: float

    # Socioeconómicos
    address: str
    origin_address: str
    economic_dependence: str
    dependents_count: int
    family_income: float
    income_per_capita: float

    # Motivos e Historial
    previous_scholarship: str = "No"

    # AHORA ES TOTALMENTE OPCIONAL (Para lógica de Rezagados)
    release_folio: Optional[str] = None

    activities: Optional[str] = None
    motivos: str

    # Documentos
    doc_address: str
    doc_income: str
    doc_ine: str
    doc_kardex: str
    doc_extra: Optional[str] = None

    # --- VALIDACIONES DE NEGOCIO ---
    @field_validator('arithmetic_average', 'certified_average')
    @classmethod
    def validate_averages(cls, v):
        if not (0 <= v <= 100):
            raise ValueError('El promedio debe estar entre 0 y 100.')
        return v

    # NOTA: Se eliminó check_release_folio para permitir flujos de regularización


class ApplicationCreate(ApplicationBase):
    scholarship_id: int
    doc_request: Optional[str] = None
    doc_motivos: Optional[str] = None


class ApplicationRead(ApplicationBase):
    id: int
    status: ApplicationStatus
    admin_comments: Optional[str] = None
    created_at: datetime
    scholarship_name: Optional[str] = None
    doc_request: Optional[str] = None
    doc_motivos: Optional[str] = None


class ApplicationUpdate(SQLModel):
    status: Optional[ApplicationStatus] = None
    admin_comments: Optional[str] = None
    doc_request: Optional[str] = None
    doc_motivos: Optional[str] = None


# --- RESULTADOS PÚBLICOS (SAFE) ---
class ApplicationPublicStatus(SQLModel):
    id: int
    scholarship_id: int
    full_name: str
    control_number: str
    status: ApplicationStatus
    admin_comments: Optional[str] = None
    created_at: datetime