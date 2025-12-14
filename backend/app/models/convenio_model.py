from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, JSON

# Tu modelo base (Tal cual me lo pasaste, con pequeños ajustes para herencia)
class ConvenioBase(SQLModel):
    nombre: str
    descripcion_corta: str
    descripcion_larga: str
    categoria: str = Field(index=True)
    imagen_url: str
    direccion: Optional[str] = None
    # Definimos tipos explícitos para Pydantic
    beneficios: List[str] = Field(default=[], sa_type=JSON)
    social_links: Dict[str, Any] = Field(default={}, sa_type=JSON)
    is_active: bool = Field(default=True)

# El modelo de la Tabla (Tu código original)
class Convenio(ConvenioBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

# Esquema para CREAR (Lo que recibe el POST)
class ConvenioCreate(ConvenioBase):
    pass

# Esquema para LEER (Lo que devuelve el GET, incluye ID)
class ConvenioRead(ConvenioBase):
    id: int