from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.user_model import User


class News(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    slug: str = Field(index=True)
    excerpt: str = Field(max_length=200)
    content: str
    imagen_url: Optional[str] = None

    # --- NUEVO CAMPO ---
    video_url: Optional[str] = None  # Link a YouTube/FB/Instagram

    is_published: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    author_id: Optional[int] = Field(default=None, foreign_key="user.id")