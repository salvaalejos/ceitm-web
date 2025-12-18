from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class DocumentCategory(str, Enum):
    FINANCIERO = "Financiero"  # Informes del Tesorero
    LEGAL = "Legal y Normativo"  # Reglamentos, Estatutos PDF
    ACTAS = "Actas y Acuerdos"  # Minutas de sesiones
    CONVOCATORIAS = "Convocatorias"  # Elecciones, Becas pasadas
    OTROS = "Otros"


class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    file_url: str  # La URL del PDF
    category: DocumentCategory

    # Metadatos
    is_public: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)