from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from enum import Enum
from datetime import datetime

# Evitamos importaciones circulares
if TYPE_CHECKING:
    from app.models.student_model import Student


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
    LIBERADA = "Liberada"


# --- NUEVO: Periodos Escolares Estandarizados ---
class ScholarshipPeriod(str, Enum):
    ENE_JUN = "Enero-Junio"
    AGO_DIC = "Agosto-Diciembre"
    VERANO = "Verano"


# --- CUPOS POR CARRERA ---
class ScholarshipQuota(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    scholarship_id: int = Field(foreign_key="scholarship.id", index=True)
    career_name: str = Field(index=True)
    total_slots: int = Field(default=0)
    used_slots: int = Field(default=0)

    scholarship: "Scholarship" = Relationship(back_populates="quotas")

    @property
    def available_slots(self) -> int:
        return self.total_slots - self.used_slots


# --- CONVOCATORIA (ADMIN) ---
class Scholarship(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    type: ScholarshipType
    description: str
    start_date: datetime
    end_date: datetime
    results_date: datetime

    # --- CAMBIO: Configuración Manual del Folio ---
    # En lugar de un string "cycle", usamos datos estructurados
    year: int = Field(default_factory=lambda: datetime.now().year)
    period: ScholarshipPeriod = Field(default=ScholarshipPeriod.ENE_JUN)

    # Identificador de Actividad (ej. "Recolecta", "Donación", "Servicio")
    # De aquí tomaremos las primeras 3 letras (REC, DON, SER)
    folio_identifier: str = Field(max_length=50)

    is_active: bool = True

    # Relaciones
    applications: List["ScholarshipApplication"] = Relationship(back_populates="scholarship")
    quotas: List["ScholarshipQuota"] = Relationship(back_populates="scholarship")


# --- SOLICITUD ---
class ScholarshipApplication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    scholarship_id: int = Field(foreign_key="scholarship.id")

    # Vinculación con Expediente de Alumno
    student_id: Optional[str] = Field(default=None, foreign_key="student.control_number")

    # 1. DATOS PERSONALES
    full_name: str
    email: str
    phone_number: str
    control_number: str = Field(index=True)
    career: str
    semester: str

    # Foto del Estudiante
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

    # Folio Único de Liberación
    release_folio: Optional[str] = Field(default=None, unique=True, index=True)

    activities: Optional[str] = None
    motivos: str = Field(max_length=2000)

    # 5. DOCUMENTOS
    doc_request: Optional[str] = None
    doc_motivos: Optional[str] = None
    doc_address: str
    doc_income: str
    doc_ine: str
    doc_kardex: str
    doc_extra: Optional[str] = None

    # CONTROL
    status: ApplicationStatus = Field(default=ApplicationStatus.PENDIENTE)
    admin_comments: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relaciones
    scholarship: Optional[Scholarship] = Relationship(back_populates="applications")
    student: Optional["Student"] = Relationship(back_populates="applications")