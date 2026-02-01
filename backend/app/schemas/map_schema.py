from typing import List, Optional, Any, Dict
from sqlmodel import SQLModel

# --- ROOM SCHEMAS ---
class RoomBase(SQLModel):
    name: str
    floor: str = "PB" # PB, 1, 2, 3
    type: str = "CLASSROOM" # CLASSROOM, LAB, OFFICE, WC, etc.

class RoomCreate(RoomBase):
    building_id: int

class RoomUpdate(SQLModel):
    name: Optional[str] = None
    floor: Optional[str] = None
    type: Optional[str] = None
    building_id: Optional[int] = None

class RoomRead(RoomBase):
    id: int
    building_id: int

# --- BUILDING SCHEMAS ---
class BuildingBase(SQLModel):
    name: str
    code: str
    description: Optional[str] = None
    category: str = "AULAS"
    image_url: Optional[str] = None
    tags: Optional[str] = None
    coordinates: Optional[Any] = None # JSONField

class BuildingCreate(BuildingBase):
    pass

class BuildingUpdate(SQLModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[str] = None
    coordinates: Optional[Any] = None

class BuildingRead(BuildingBase):
    id: int

class BuildingWithRooms(BuildingRead):
    rooms: List[RoomRead] = []

class MapSearchResult(SQLModel):
    id: int               # ID del objeto (ya sea Room o Building)
    type: str             # "BUILDING" o "ROOM"
    name: str             # Nombre principal (ej: "K1" o "Edificio K")
    detail: str           # Subtítulo (ej: "En Edificio K" o "AULAS")
    building_id: int      # ID del edificio padre (para cargar el detalle al hacer click)
    coordinates: Optional[Dict[str, Any]] = None # Coordenadas a donde volar
    category: Optional[str] = None