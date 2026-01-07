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


# --- CUPOS POR CARRERA ---
class ScholarshipQuota(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    scholarship_id: int = Field(foreign_key="scholarship.id", index=True)
    career_name: str = Field(index=True)
    total_slots: int = Field(default=0)
    used_slots: int = Field(default=0)
    scholarship: "Scholarship" = Relationship(back_populates="quotas")


# --- CONVOCATORIA ---
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
    quotas: List["ScholarshipQuota"] = Relationship(back_populates="scholarship")


# --- SOLICITUD (MODIFICADA) ---
class ScholarshipApplication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    scholarship_id: int = Field(foreign_key="scholarship.id")

    # 1. DATOS PERSONALES
    full_name: str
    email: str
    phone_number: str
    control_number: str = Field(index=True)
    career: str
    semester: str

    # NUEVO: Foto del Estudiante (Obligatoria para la solicitud generada)
    student_photo: str

    # Específicos
    cle_control_number: Optional[str] = None
    level_to_enter: Optional[str] = None

    # 2. DATOS ACADÉMICOS
    arithmetic_average: float = Field(default=0.0)
    certified_average: float = Field(default=0.0)

    # 3. SOCIOECONÓMICOS
    address: str
    origin_address: str
    economic_dependence: str
    dependents_count: int
    family_income: float
    income_per_capita: float

    # 4. MOTIVOS E HISTORIAL
    previous_scholarship: str = Field(default="No")
    release_folio: Optional[str] = Field(default=None, index=True)
    activities: Optional[str] = None
    motivos: str = Field(max_length=2000)

    # 5. DOCUMENTOS
    # doc_request y doc_motivos ahora son OPCIONALES (Null) al inicio.
    # Se llenarán cuando el sistema genere el PDF unificado.
    doc_request: Optional[str] = None
    doc_motivos: Optional[str] = None

    # Evidencias obligatorias (subidas por alumno)
    doc_address: str
    doc_income: str
    doc_ine: str
    doc_kardex: str
    doc_extra: Optional[str] = None

    # CONTROL
    status: ApplicationStatus = Field(default=ApplicationStatus.PENDIENTE)
    admin_comments: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    scholarship: Optional[Scholarship] = Relationship(back_populates="applications")