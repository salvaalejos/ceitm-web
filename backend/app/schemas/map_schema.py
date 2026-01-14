from typing import List, Optional, Dict, Any
from sqlmodel import SQLModel

# =======================
# ROOM SCHEMAS (Salones)
# =======================

class RoomBase(SQLModel):
    name: str
    floor: str = "PB"
    type: str = "CLASSROOM"
    building_id: int

class RoomCreate(RoomBase):
    pass

class RoomUpdate(SQLModel):
    name: Optional[str] = None
    floor: Optional[str] = None
    type: Optional[str] = None
    building_id: Optional[int] = None

class RoomRead(RoomBase):
    id: int

# =======================
# BUILDING SCHEMAS (Edificios)
# =======================

class BuildingBase(SQLModel):
    name: str
    code: str
    description: Optional[str] = None
    category: str = "AULAS"
    image_url: Optional[str] = None
    tags: Optional[str] = None
    # Usamos Dict[str, Any] para permitir flexibilidad en las coordenadas (punto o polígono)
    coordinates: Dict[str, Any] = {}

class BuildingCreate(BuildingBase):
    pass

class BuildingUpdate(SQLModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[str] = None
    coordinates: Optional[Dict[str, Any]] = None

class BuildingRead(BuildingBase):
    id: int

# Schema especial para cuando haces click en un edificio:
# Devuelve la info del edificio + la lista de todos sus salones dentro.
class BuildingWithRooms(BuildingRead):
    rooms: List[RoomRead] = []