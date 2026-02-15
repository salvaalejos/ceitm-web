from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from enum import Enum
from datetime import datetime

# Evitamos ciclos de importación
if TYPE_CHECKING:
    from app.models.sanction_model import Sanction
    from app.models.shift_model import Shift


# 1. JERARQUÍA (El "Nivel" o Rango)
class UserRole(str, Enum):
    ADMIN_SYS = "admin_sys"  # Superusuario / Desarrollador
    ESTRUCTURA = "estructura"  # Mesa Directiva (Presidente, Secretario, etc.)
    COORDINADOR = "coordinador"  # Titular de un área
    CONCEJAL = "concejal"  # Representante de carrera (Voz y voto)
    VOCAL = "vocal"  # Apoyo operativo


# 2. ÁREA (El "Departamento" o Función)
class UserArea(str, Enum):
    # Alta Dirección
    PRESIDENCIA = "Presidencia"
    SECRETARIA = "Secretaría General"
    TESORERIA = "Tesorería"
    CONTRALORIA = "Contraloría"

    # Coordinaciones Operativas
    ACADEMICO = "Académico"
    VINCULACION = "Vinculación"
    BECAS = "Becas y Apoyos"
    COMUNICACION = "Comunicación y Difusión"
    EVENTOS = "Eventos (SODECU)"
    PREVENCION = "Prevención y Logística"
    MARKETING = "Marketing y Diseño"

    # Otros
    CONSEJO_GENERAL = "Consejo General"  # Para concejales que no están en una coord específica
    SISTEMAS = "Sistemas"  # Para el Admin
    NINGUNA = "Ninguna"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str

    phone_number: Optional[str] = Field(default=None)  # Para WhatsApp
    instagram_url: Optional[str] = Field(default=None)  # Link al perfil

    # --- ESTRUCTURA ---
    role: UserRole = Field(default=UserRole.VOCAL)  # Jerarquía
    area: UserArea = Field(default=UserArea.NINGUNA)  # Departamento

    # Carrera (Sigue siendo útil para filtros escolares, independiente del área interna)
    career: Optional[str] = None

    imagen_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # --- NUEVAS RELACIONES (Actualización Fase 1) ---

    # 1. Historial de Sanciones del usuario
    sanctions: List["Sanction"] = Relationship(back_populates="user")

    # 2. Horarios de Guardia asignados
    shifts: List["Shift"] = Relationship(back_populates="user")