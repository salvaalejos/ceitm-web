from typing import Optional
from sqlmodel import SQLModel, Field


class Career(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)  # Ej: "Ingeniería en Sistemas Computacionales"
    slug: str = Field(unique=True, index=True)  # Ej: "sistemas" (para usarlo en URLs o filtros limpios)

    whatsapp_url: Optional[str] = None

    # Extras útiles para el frontend
    image_url: Optional[str] = None
    is_active: bool = Field(default=True)