from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel


class NewsBase(SQLModel):
    title: str
    excerpt: str
    content: str
    imagen_url: Optional[str] = None

    # --- TUS CAMPOS NUEVOS ---
    video_url: Optional[str] = None

    # 👇 AQUÍ AGREGAMOS LA CATEGORÍA
    # Le ponemos "GENERAL" por defecto para que sea opcional al crear si no se especifica
    category: str = "GENERAL"

    is_published: bool = True


class NewsCreate(NewsBase):
    pass


class NewsUpdate(SQLModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    imagen_url: Optional[str] = None
    video_url: Optional[str] = None

    # 👇 AQUÍ TAMBIÉN PARA PODER EDITARLA
    category: Optional[str] = None

    is_published: Optional[bool] = None


class NewsPublic(NewsBase):
    id: int
    slug: str
    created_at: datetime
    author_id: Optional[int]