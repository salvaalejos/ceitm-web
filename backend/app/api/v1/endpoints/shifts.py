from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api import deps
from app.models.user_model import User, UserRole, UserArea
from app.models.shift_model import Shift
from app.schemas.shift_schema import ShiftCreate, ShiftRead

router = APIRouter()


# -----------------------------------------------------------------------------
# GET / - Obtener toda la grilla de horarios
# -----------------------------------------------------------------------------
@router.get("/", response_model=List[ShiftRead])
def read_shifts(
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_active_user),
        skip: int = 0,
        limit: int = 100,
):
    """
    Recupera la lista de turnos asignados.
    Visible para todos los usuarios autenticados.
    """
    statement = select(Shift).offset(skip).limit(limit)
    shifts = db.exec(statement).all()
    return shifts


# -----------------------------------------------------------------------------
# POST / - Asignar un turno (Solo Contraloría/Admin)
# -----------------------------------------------------------------------------
@router.post("/", response_model=ShiftRead)
def create_shift(
        *,
        db: Session = Depends(deps.get_db),
        shift_in: ShiftCreate,
        current_user: User = Depends(deps.get_current_active_user),
):
    """
    Asigna un usuario a un bloque de hora/día.
    Restringido a: Contraloría o Admin Sys.
    """
    # 1. Verificar Permisos
    is_admin = current_user.role == UserRole.ADMIN_SYS
    is_contraloria = current_user.area == UserArea.CONTRALORIA

    if not (is_admin or is_contraloria):
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para asignar guardias. Contacta a Contraloría."
        )

    # 2. Verificar si el usuario a asignar existe
    user = db.get(User, shift_in.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="El usuario indicado no existe.")

    # 3. Verificar choque de horarios (Bloque ocupado)
    #    Buscamos si YA existe un registro para ese Día + Hora
    statement = select(Shift).where(
        Shift.day == shift_in.day,
        Shift.hour == shift_in.hour
    )
    existing_shift = db.exec(statement).first()

    if existing_shift:
        # Opción A: Bloquear
        raise HTTPException(
            status_code=400,
            detail=f"El horario {shift_in.day} a las {shift_in.hour}:00 ya está ocupado por {existing_shift.user.full_name}."
        )
        # Opción B (Alternativa): Sobrescribir (Si prefieres esto, avísame)

    # 4. Crear el turno
    shift = Shift.from_orm(shift_in)
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


# -----------------------------------------------------------------------------
# DELETE /{id} - Eliminar un turno (Solo Contraloría/Admin)
# -----------------------------------------------------------------------------
@router.delete("/{id}", response_model=ShiftRead)
def delete_shift(
        *,
        db: Session = Depends(deps.get_db),
        id: int,
        current_user: User = Depends(deps.get_current_active_user),
):
    """
    Elimina una asignación de guardia.
    """
    # 1. Verificar Permisos
    is_admin = current_user.role == UserRole.ADMIN_SYS
    is_contraloria = current_user.area == UserArea.CONTRALORIA

    if not (is_admin or is_contraloria):
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar guardias.")

    shift = db.get(Shift, id)
    if not shift:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    db.delete(shift)
    db.commit()
    return shift