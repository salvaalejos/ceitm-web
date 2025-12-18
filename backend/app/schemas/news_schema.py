from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel


class NewsBase(SQLModel):
    title: str
    excerpt: str
    content: str
    imagen_url: Optional[str] = None

    # --- NUEVO CAMPO ---
    video_url: Optional[str] = None

    is_published: bool = True


class NewsCreate(NewsBase):
    pass


class NewsUpdate(SQLModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    imagen_url: Optional[str] = None
    video_url: Optional[str] = None  # <--- AQUÍ TAMBIÉN
    is_published: Optional[bool] = None


class NewsPublic(NewsBase):
    id: int
    slug: str
    created_at: datetime
    author_id: Optional[int]