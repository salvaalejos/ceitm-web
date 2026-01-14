from typing import Optional, List, Dict
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import JSON, Column


class Building(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)  # Ej: "Edificio K - Aulas"
    code: str = Field(unique=True, index=True)  # Ej: "K" (Identificador corto)
    description: Optional[str] = None
    category: str = Field(default="AULAS")  # AULAS, ADMINISTRATIVO, LABS, SERVICIOS, AREAS_VERDES

    # Guardamos las coordenadas como un objeto JSON: {"lat": 19.xxx, "lng": -101.xxx}
    # Esto nos da flexibilidad para puntos o incluso polígonos futuros.
    coordinates: Dict = Field(default={}, sa_column=Column(JSON))

    image_url: Optional[str] = None
    tags: Optional[str] = None  # Palabras clave separadas por comas para el buscador: "sistemas, baños, k"

    # Relación: Un edificio tiene muchos salones
    rooms: List["Room"] = Relationship(back_populates="building")


class Room(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)  # Ej: "K1"
    floor: str = Field(default="PB")  # PB (Planta Baja), 1 (Primer Piso), 2...
    type: str = Field(default="CLASSROOM")  # CLASSROOM, LAB, OFFICE, WC

    # Relación: Un salón pertenece a un edificio
    building_id: Optional[int] = Field(default=None, foreign_key="building.id")
    building: Optional[Building] = Relationship(back_populates="rooms")