from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api import deps
from app.models.user_model import User, UserRole, UserArea
from app.models.shift_model import Shift
from app.schemas.shift_schema import ShiftCreate, ShiftRead

router = APIRouter()


# --- FUNCIÓN AUXILIAR DE PERMISOS ---
def is_contraloria_manager(user: User) -> bool:
    return (
            user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA] or
            user.area in [UserArea.CONTRALORIA, UserArea.PRESIDENCIA]
    )


# -----------------------------------------------------------------------------
# GET / - Obtener toda la grilla de horarios
# -----------------------------------------------------------------------------
@router.get("/", response_model=List[ShiftRead])
def read_shifts(
        db: Session = Depends(deps.get_db),
        skip: int = 0,
        limit: int = 100,
):
    """
    Recupera la lista de turnos asignados.
    """
    from sqlalchemy.orm import selectinload
    statement = select(Shift).options(selectinload(Shift.user)).offset(skip).limit(limit)
    shifts = db.exec(statement).all()
    return shifts


# -----------------------------------------------------------------------------
# POST / - Asignar un turno
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
    """
    if not is_contraloria_manager(current_user):
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para asignar guardias."
        )

    user = db.get(User, shift_in.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="El usuario indicado no existe.")

    statement = select(Shift).where(
        Shift.day == shift_in.day,
        Shift.hour == shift_in.hour
    )
    existing_shift = db.exec(statement).first()

    if existing_shift:
        raise HTTPException(
            status_code=400,
            detail=f"El horario ya está ocupado por {existing_shift.user.full_name}."
        )

    shift = Shift.from_orm(shift_in)
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


# -----------------------------------------------------------------------------
# DELETE /{id} - Eliminar un turno
# -----------------------------------------------------------------------------
# 👇 CORRECCIÓN: Quitamos el response_model que causaba el crash
@router.delete("/{id}")
def delete_shift(
        *,
        db: Session = Depends(deps.get_db),
        id: int,
        current_user: User = Depends(deps.get_current_active_user),
):
    """
    Elimina una asignación de guardia.
    """
    if not is_contraloria_manager(current_user):
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar guardias.")

    shift = db.get(Shift, id)
    if not shift:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    db.delete(shift)
    db.commit()

    # 👇 CORRECCIÓN: Devolvemos un simple OK en lugar de intentar leer el objeto borrado
    return {"ok": True, "message": "Turno liberado correctamente"}