from datetime import date, time, datetime
from enum import Enum
from typing import Dict, List, Optional

from sqlalchemy import JSON
from sqlmodel import Field, SQLModel
from sqlmodel.main import NaiveDatetime


class JustificanteTipo(str, Enum):
    INDIVIDUAL = "individual"
    COLECTIVO = "colectivo"


class JustificanteEstado(str, Enum):
    PENDIENTE = "pendiente"
    APROBADO = "aprobado"
    RECHAZADO = "rechazado"


class JustificanteParticipante(SQLModel):
    nombre: str
    numero_control: str
    carrera: str


class Justificante(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    tipo: JustificanteTipo
    actividad: str
    fecha: date
    hora_inicio: time
    hora_fin: time
    folio: str  # Número de oficio (manual, ej. "001 EJ 2026")

    participantes: List[Dict[str, str]] = Field(default=[], sa_type=JSON)

    estado: JustificanteEstado = Field(default=JustificanteEstado.PENDIENTE, index=True)
    motivo_rechazo: Optional[str] = None

    created_by_id: int = Field(foreign_key="user.id", index=True)
    approved_by_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    approved_at: Optional[NaiveDatetime] = None

    sello_digital: Optional[str] = None
    qr_token: Optional[str] = Field(default=None, unique=True, index=True)

    created_at: NaiveDatetime = Field(default_factory=datetime.utcnow)


class JustificanteCreate(SQLModel):
    tipo: JustificanteTipo
    actividad: str
    fecha: date
    hora_inicio: time
    hora_fin: time
    folio: str
    participantes: List[JustificanteParticipante]


class JustificanteRead(SQLModel):
    id: int
    tipo: str
    actividad: str
    fecha: date
    hora_inicio: time
    hora_fin: time
    folio: str
    participantes: List[JustificanteParticipante]
    estado: str
    motivo_rechazo: Optional[str] = None
    created_by_id: int
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    sello_digital: Optional[str] = None
    qr_token: Optional[str] = None
    created_at: datetime
    creador: Optional[str] = None
    aprobador: Optional[str] = None