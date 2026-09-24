from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel
from sqlmodel.main import NaiveDatetime


class FirmaDigital(SQLModel, table=True):
    """Firma digital persistida por usuario de Estructura/Admin (se reutiliza al aprobar)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    imagen_url: str
    updated_at: NaiveDatetime = Field(default_factory=datetime.utcnow)