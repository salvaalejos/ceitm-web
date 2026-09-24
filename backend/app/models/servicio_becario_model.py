from typing import Optional, TYPE_CHECKING
from enum import Enum
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship
from sqlmodel.main import NaiveDatetime

if TYPE_CHECKING:
    from app.models.student_model import Student


class ServicioPeriodo(str, Enum):
    A = "A"  # Ene-Jun
    B = "B"  # Ago-Dic
    V = "V"  # Verano


class ServicioEstado(str, Enum):
    PENDIENTE = "pendiente"
    LIBERADO = "liberado"


class ServicioBecario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    control_number: str = Field(foreign_key="student.control_number", index=True)

    actividad: str
    periodo: ServicioPeriodo
    anio: int
    estado: ServicioEstado = Field(default=ServicioEstado.PENDIENTE)

    # Folio único generado al liberar el servicio
    folio: Optional[str] = Field(default=None, unique=True, index=True)

    liberado_at: Optional[NaiveDatetime] = None
    created_at: NaiveDatetime = Field(default_factory=datetime.utcnow)

    student: Optional["Student"] = Relationship(back_populates="servicios")