from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, col

from app.api import deps
from app.models.map_model import Building, Room
from app.models.user_model import User, UserRole
from app.schemas.map_schema import (
    BuildingCreate, BuildingRead, BuildingUpdate, BuildingWithRooms,
    RoomCreate, RoomRead, RoomUpdate, MapSearchResult
)

router = APIRouter()


# --- DEPENDENCIA DE PERMISOS ---
def check_map_permissions(current_user: User = Depends(deps.get_current_active_user)):
    """Permite acceso solo a ADMIN_SYS y ESTRUCTURA"""
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos para gestionar el mapa.")
    return current_user


# =======================
# PUBLIC ENDPOINTS
# =======================

@router.get("/buildings", response_model=List[BuildingRead])
def read_buildings(
        db: Session = Depends(deps.get_db),
        skip: int = 0,
        limit: int = 100,
) -> Any:
    """Obtener todos los edificios (para pintar el mapa)."""
    buildings = db.exec(select(Building).offset(skip).limit(limit)).all()
    return buildings


@router.get("/buildings/search", response_model=List[MapSearchResult])
def search_map(
        q: str = Query(..., min_length=1),
        db: Session = Depends(deps.get_db)
) -> Any:
    """
    Buscador Híbrido: Devuelve lista mixta con CATEGORÍA para iconos correctos.
    """
    query = q.lower()
    results = []

    # 1. Buscar Edificios
    statement_buildings = select(Building).where(
        (col(Building.name).ilike(f"%{query}%")) |
        (col(Building.code).ilike(f"%{query}%")) |
        (col(Building.tags).ilike(f"%{query}%"))
    )
    buildings = db.exec(statement_buildings).all()

    for b in buildings:
        results.append(MapSearchResult(
            id=b.id,
            type="BUILDING",
            name=b.name,
            detail=b.category,  # Texto para mostrar (ej: AULAS)
            building_id=b.id,
            coordinates=b.coordinates,
            category=b.category  # 👈 Categoría para color (AULAS, LABS...)
        ))

    # 2. Buscar Salones
    statement_rooms = select(Room, Building).join(Building).where(
        col(Room.name).ilike(f"%{query}%")
    )
    rooms_data = db.exec(statement_rooms).all()

    for room, parent in rooms_data:
        results.append(MapSearchResult(
            id=room.id,
            type="ROOM",
            name=room.name,
            detail=f"En {parent.name}",  # Texto para mostrar
            building_id=parent.id,
            coordinates=parent.coordinates,
            category=room.type  # 👈 TIPO DE SALÓN (LAB, OFFICE, ETC)
        ))

    return results


@router.get("/buildings/{building_id}", response_model=BuildingWithRooms)
def read_building(
        building_id: int,
        db: Session = Depends(deps.get_db)
) -> Any:
    """Obtener detalle de un edificio específico y sus salones."""
    building = db.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")
    return building


# =======================
# ADMIN ENDPOINTS (Protected)
# =======================

# --- BUILDINGS ---

@router.post("/buildings", response_model=BuildingRead)
def create_building(
        *,
        db: Session = Depends(deps.get_db),
        building_in: BuildingCreate,
        current_user: User = Depends(check_map_permissions),
) -> Any:
    building = Building.from_orm(building_in)
    db.add(building)
    db.commit()
    db.refresh(building)
    return building


@router.put("/buildings/{building_id}", response_model=BuildingRead)
def update_building(
        *,
        db: Session = Depends(deps.get_db),
        building_id: int,
        building_in: BuildingUpdate,
        current_user: User = Depends(check_map_permissions),
) -> Any:
    building = db.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")

    hero_data = building_in.dict(exclude_unset=True)
    for key, value in hero_data.items():
        setattr(building, key, value)

    db.add(building)
    db.commit()
    db.refresh(building)
    return building


@router.delete("/buildings/{building_id}")
def delete_building(
        *,
        db: Session = Depends(deps.get_db),
        building_id: int,
        current_user: User = Depends(check_map_permissions),
) -> Any:
    building = db.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")

    db.delete(building)
    db.commit()
    return {"ok": True}


# --- ROOMS ---

@router.post("/rooms", response_model=RoomRead)
def create_room(
        *,
        db: Session = Depends(deps.get_db),
        room_in: RoomCreate,
        current_user: User = Depends(check_map_permissions),
) -> Any:
    room = Room.from_orm(room_in)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.put("/rooms/{room_id}", response_model=RoomRead)
def update_room(
        *,
        db: Session = Depends(deps.get_db),
        room_id: int,
        room_in: RoomUpdate,
        current_user: User = Depends(check_map_permissions),
) -> Any:
    room = db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Salón no encontrado")

    room_data = room_in.dict(exclude_unset=True)
    for key, value in room_data.items():
        setattr(room, key, value)

    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.delete("/rooms/{room_id}")
def delete_room(
        *,
        db: Session = Depends(deps.get_db),
        room_id: int,
        current_user: User = Depends(check_map_permissions),
) -> Any:
    room = db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    db.delete(room)
    db.commit()
    return {"ok": True}