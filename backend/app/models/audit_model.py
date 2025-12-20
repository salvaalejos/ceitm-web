from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Quién lo hizo
    user_id: int
    user_email: str
    user_role: str

    # Qué hizo
    action: str  # Ej: "CREATE", "DELETE", "UPDATE", "LOGIN"
    module: str  # Ej: "USUARIOS", "BECAS", "CONVENIOS"

    # Detalles técnicos
    resource_id: Optional[str] = None  # ID del objeto afectado (ej. ID de la beca 5)
    details: Optional[str] = None  # Descripción legible: "Eliminó al usuario Juan"

    # Metadatos
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)