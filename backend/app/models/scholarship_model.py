from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from enum import Enum
from datetime import datetime


class ScholarshipType(str, Enum):
    ALIMENTICIA = "Alimenticia"
    REINSCRIPCION = "Reinscripción"
    CLE = "CLE (Idiomas)"
    OTRA = "Otra"


class ApplicationStatus(str, Enum):
    PENDIENTE = "Pendiente"
    EN_REVISION = "En Revisión"
    APROBADA = "Aprobada"
    RECHAZADA = "Rechazada"
    DOCUMENTACION_FALTANTE = "Documentación Faltante"


# --- CONVOCATORIA (Igual) ---
class Scholarship(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    type: ScholarshipType
    description: str
    start_date: datetime
    end_date: datetime
    results_date: datetime
    cycle: str
    is_active: bool = True
    applications: List["ScholarshipApplication"] = Relationship(back_populates="scholarship")


# --- SOLICITUD (CORREGIDO: PÚBLICO) ---
class ScholarshipApplication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # RELACIONES
    scholarship_id: int = Field(foreign_key="scholarship.id")

    # 1. DATOS PERSONALES (NUEVOS CAMPOS OBLIGATORIOS)
    full_name: str  # <--- AHORA LO PEDIMOS EN EL FORM
    email: str  # <--- AHORA LO PEDIMOS EN EL FORM
    phone_number: str

    control_number: str  # <--- ESTE SERÁ NUESTRA LLAVE ÚNICA POR BECA
    career: str
    semester: str

    # Específicos
    cle_control_number: Optional[str] = None
    level_to_enter: Optional[str] = None

    # 2. SOCIOECONÓMICOS
    address: str
    origin_address: str
    economic_dependence: str
    dependents_count: int
    family_income: float
    income_per_capita: float

    # 3. MOTIVOS
    previous_scholarship: Optional[str] = None
    activities: Optional[str] = None
    motivos: str = Field(max_length=2000)

    # 4. DOCUMENTOS (URLs)
    doc_request: Optional[str] = None
    doc_motivos: Optional[str] = None
    doc_address: Optional[str] = None
    doc_income: Optional[str] = None
    doc_ine: Optional[str] = None
    doc_school_id: Optional[str] = None
    doc_schedule: Optional[str] = None
    doc_extra: Optional[str] = None

    # CONTROL
    status: ApplicationStatus = Field(default=ApplicationStatus.PENDIENTE)
    admin_comments: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    scholarship: Optional[Scholarship] = Relationship(back_populates="applications")