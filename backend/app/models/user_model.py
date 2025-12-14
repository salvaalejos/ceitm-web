from typing import Optional
from enum import Enum
from sqlmodel import Field, SQLModel
from datetime import datetime

# Roles basados en el Artículo 26 de los Estatutos
class UserRole(str, Enum):
    PRESIDENTE = "presidente"
    SECRETARIO = "secretario"
    TESORERO = "tesorero"
    CONTRALOR = "contralor"
    COORD_ACADEMICO = "coord_academico"
    COORD_VINCULACION = "coord_vinculacion"
    COORD_COMEDOR = "coord_comedor"
    COORD_COMUNICACION = "coord_comunicacion"
    COORD_EVENTOS = "coord_eventos"
    COORD_PREVENCION = "coord_prevencion"
    COORD_MARKETING = "coord_marketing"
    VOCAL = "vocal"
    ADMIN_SYS = "admin_sys" # Rol extra para ti como desarrollador

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    role: UserRole
    career: Optional[str] = None # Para concejales por carrera
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)