from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
from pydantic import field_validator, model_validator
from app.models.scholarship_model import ScholarshipType, ApplicationStatus


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

    # Calculamos disponible al vuelo si viene del ORM o usamos el valor si ya existe
    @field_validator('available_slots', mode='before', check_fields=False)
    @classmethod
    def calculate_available(cls, v, values):
        # Si 'v' ya tiene valor (por la propiedad del modelo), lo usamos.
        if v is not None:
            return v
        # Fallback de seguridad
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
    cycle: str
    is_active: bool = True


class ScholarshipCreate(ScholarshipBase):
    pass


class ScholarshipRead(ScholarshipBase):
    id: int
    # Incluimos los cupos al leer la convocatoria completa
    quotas: List[ScholarshipQuotaRead] = []


class ScholarshipUpdate(SQLModel):
    name: Optional[str] = None
    type: Optional[ScholarshipType] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    results_date: Optional[datetime] = None
    cycle: Optional[str] = None
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

    # FOTO OBLIGATORIA (La sube el alumno)
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
    release_folio: Optional[str] = None
    activities: Optional[str] = None
    motivos: str

    # Documentos
    # NOTA: Ya no pedimos doc_request ni doc_motivos aquí porque se generan después
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

    @model_validator(mode='after')
    def check_release_folio(self):
        prev = self.previous_scholarship
        folio = self.release_folio

        # Detectar si la respuesta implica haber tenido beca
        keywords = ["Alimenticia", "Reinscripción", "CLE", "Otro:", "Sí"]
        has_keyword = any(k in prev for k in keywords) if prev else False

        if has_keyword and (not folio or len(folio.strip()) == 0):
            raise ValueError(f'Debes ingresar tu Folio de Liberación si tuviste beca ({prev}) anteriormente.')

        return self


class ApplicationCreate(ApplicationBase):
    scholarship_id: int
    # Permitimos que sean nulos al crear la solicitud
    doc_request: Optional[str] = None
    doc_motivos: Optional[str] = None


class ApplicationRead(ApplicationBase):
    id: int
    status: ApplicationStatus
    admin_comments: Optional[str] = None
    created_at: datetime
    scholarship_name: Optional[str] = None

    # Al leer, pueden venir nulos si aún no se generan
    doc_request: Optional[str] = None
    doc_motivos: Optional[str] = None


class ApplicationUpdate(SQLModel):
    status: Optional[ApplicationStatus] = None
    admin_comments: Optional[str] = None
    # Permitimos actualizar estos campos (cuando el sistema genere el PDF)
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