from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, col

from app.api import deps
from app.models.map_model import Building, Room
from app.models.user_model import User
from app.schemas.map_schema import (
    BuildingCreate, BuildingRead, BuildingUpdate, BuildingWithRooms,
    RoomCreate, RoomRead, RoomUpdate
)

router = APIRouter()


# =======================
# PUBLIC ENDPOINTS
# =======================

@router.get("/buildings", response_model=List[BuildingRead])
def read_buildings(
        db: Session = Depends(deps.get_db),
        skip: int = 0,
        limit: int = 100,
) -> Any:
    """
    Obtener todos los edificios (para pintar el mapa).
    """
    buildings = db.exec(select(Building).offset(skip).limit(limit)).all()
    return buildings


@router.get("/buildings/search", response_model=List[BuildingRead])
def search_map(
        q: str = Query(..., min_length=1),
        db: Session = Depends(deps.get_db)
) -> Any:
    """
    Buscador inteligente:
    Busca en Edificios (nombre, codigo, tags) O en Salones (nombre).
    Si coincide un salón, devuelve el edificio padre.
    """
    query = q.lower()

    # 1. Buscar edificios que coincidan directamente
    statement_buildings = select(Building).where(
        (col(Building.name).ilike(f"%{query}%")) |
        (col(Building.code).ilike(f"%{query}%")) |
        (col(Building.tags).ilike(f"%{query}%"))
    )
    buildings_found = db.exec(statement_buildings).all()

    # 2. Buscar salones que coincidan (y obtener sus edificios)
    statement_rooms = select(Room).where(col(Room.name).ilike(f"%{query}%"))
    rooms_found = db.exec(statement_rooms).all()

    # Unificar resultados (evitando duplicados de edificios)
    results = set(buildings_found)
    for room in rooms_found:
        if room.building:
            results.add(room.building)

    return list(results)


@router.get("/buildings/{building_id}", response_model=BuildingWithRooms)
def read_building(
        building_id: int,
        db: Session = Depends(deps.get_db)
) -> Any:
    """
    Obtener detalle de un edificio específico y sus salones.
    """
    building = db.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")
    return building


# =======================
# ADMIN ENDPOINTS (Protected)
# =======================

@router.post("/buildings", response_model=BuildingRead)
def create_building(
        *,
        db: Session = Depends(deps.get_db),
        building_in: BuildingCreate,
        current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Crear un nuevo edificio.
    """
    building = Building.from_orm(building_in)
    db.add(building)
    db.commit()
    db.refresh(building)
    return building


@router.post("/rooms", response_model=RoomRead)
def create_room(
        *,
        db: Session = Depends(deps.get_db),
        room_in: RoomCreate,
        current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Crear un nuevo salón/espacio dentro de un edificio.
    """
    room = Room.from_orm(room_in)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room