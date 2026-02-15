from sqlmodel import SQLModel, Field
from typing import Optional
from app.models.shift_model import DayOfWeek
from pydantic import field_validator

# --- Schema Mini para mostrar usuario en la celda ---
class ShiftUserRead(SQLModel):
    id: int
    full_name: str
    area: str
    role: str

# --- BASE ---
class ShiftBase(SQLModel):
    day: DayOfWeek
    hour: int

    @field_validator('hour')
    @classmethod
    def validate_hour(cls, v):
        if not (7 <= v <= 20):
            raise ValueError('La hora debe estar entre las 7:00 AM (7) y las 8:00 PM (20).')
        return v

# --- CREATE (Lo que envía el Contralor) ---
class ShiftCreate(ShiftBase):
    user_id: int

# --- READ (Lo que recibe el Frontend) ---
class ShiftRead(ShiftBase):
    id: int
    user_id: int
    user: Optional[ShiftUserRead] = None  # Relación anidada