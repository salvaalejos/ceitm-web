from typing import Optional
from sqlmodel import SQLModel
from app.models.user_model import UserRole, UserArea

class UserBase(SQLModel):
    email: str
    full_name: str
    role: UserRole
    area: UserArea
    career: Optional[str] = None
    imagen_url: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

# --- EL PORTERO DE SALIDA ---
class UserPublic(SQLModel):
    id: int
    full_name: str
    role: UserRole
    area: UserArea
    career: Optional[str] = None
    imagen_url: Optional[str] = None
    # 👇 ESTOS DOS SON LOS CULPABLES SI FALTAN
    email: str
    is_active: bool

# --- EL PORTERO DE ACTUALIZACIÓN ---
class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    area: Optional[UserArea] = None
    career: Optional[str] = None
    imagen_url: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None # <--- Importante para poder activar/desactivar