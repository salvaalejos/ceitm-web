from sqlmodel import SQLModel, Field, Relationship
from sqlmodel.main import NaiveDatetime
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.user_model import User


class News(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    slug: str = Field(index=True, unique=True)  # Agregué unique=True, es vital para slugs
    excerpt: str = Field(max_length=200)
    content: str
    imagen_url: Optional[str] = None

    # 👇 CORRECCIÓN: Así se define en SQLModel
    category: str = Field(default="GENERAL", index=True)

    # --- TUS NUEVOS CAMPOS ---
    video_url: Optional[str] = None  # Link a YouTube/FB/Instagram

    is_published: bool = Field(default=True)
    created_at: NaiveDatetime = Field(default_factory=datetime.utcnow)
    updated_at: NaiveDatetime = Field(default_factory=datetime.utcnow)

    # Relación con Usuario
    author_id: Optional[int] = Field(default=None, foreign_key="user.id")

    # Opcional: Si quieres acceder a los datos del autor desde la noticia (ej. news.author.full_name)
    # author: Optional["User"] = Relationship(back_populates="news")