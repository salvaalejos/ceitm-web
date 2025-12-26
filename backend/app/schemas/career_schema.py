from typing import Optional
from pydantic import BaseModel

# Base común
class CareerBase(BaseModel):
    name: str
    slug: str
    whatsapp_url: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

# Para Crear (POST)
class CareerCreate(CareerBase):
    pass

# Para Actualizar (PATCH) - Todo opcional
class CareerUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    whatsapp_url: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

# Para Leer (GET) - Incluye ID
class CareerRead(CareerBase):
    id: int