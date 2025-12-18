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

    # 👇 AGREGAR AQUÍ
    phone_number: Optional[str] = None
    instagram_url: Optional[str] = None

    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserPublic(SQLModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    area: UserArea
    career: Optional[str] = None
    imagen_url: Optional[str] = None

    # 👇 AGREGAR AQUÍ TAMBIÉN (Para que el frontend los reciba)
    phone_number: Optional[str] = None
    instagram_url: Optional[str] = None

    is_active: bool


class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    area: Optional[UserArea] = None
    career: Optional[str] = None
    imagen_url: Optional[str] = None

    # 👇 Y AQUÍ (Para que el Admin los pueda editar)
    phone_number: Optional[str] = None
    instagram_url: Optional[str] = None

    password: Optional[str] = None
    is_active: Optional[bool] = None


# Schema para "Mi Perfil" (Autoservicio)
class UserUpdateMe(SQLModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    instagram_url: Optional[str] = None
    password: Optional[str] = None
    imagen_url: Optional[str] = None