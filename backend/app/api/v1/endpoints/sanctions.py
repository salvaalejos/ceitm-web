from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api import deps
from app.models.user_model import User, UserRole, UserArea
from app.models.sanction_model import Sanction
from app.schemas.sanction_schema import SanctionCreate, SanctionRead, SanctionUpdate

router = APIRouter()


# --- FUNCIÓN AUXILIAR DE PERMISOS ---
def is_contraloria_manager(user: User) -> bool:
    return (
            user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA] or
            user.area in [UserArea.CONTRALORIA, UserArea.PRESIDENCIA]
    )


# -----------------------------------------------------------------------------
# GET / - Listar Sanciones
# -----------------------------------------------------------------------------
@router.get("/", response_model=List[SanctionRead])
def read_sanctions(
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_active_user),
        skip: int = 0,
        limit: int = 100,
):
    if is_contraloria_manager(current_user):
        statement = select(Sanction).offset(skip).limit(limit).order_by(Sanction.created_at.desc())
    else:
        statement = select(Sanction).where(Sanction.user_id == current_user.id).order_by(Sanction.created_at.desc())

    sanctions = db.exec(statement).all()
    return sanctions


# -----------------------------------------------------------------------------
# POST / - Crear Sanción
# -----------------------------------------------------------------------------
@router.post("/", response_model=SanctionRead)
def create_sanction(
        *,
        db: Session = Depends(deps.get_db),
        sanction_in: SanctionCreate,
        current_user: User = Depends(deps.get_current_active_user),
):
    if not is_contraloria_manager(current_user):
        raise HTTPException(status_code=403, detail="No tienes permisos para sancionar.")

    user = db.get(User, sanction_in.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="El usuario a sancionar no existe.")

    sanction = Sanction.from_orm(sanction_in)
    db.add(sanction)
    db.commit()
    db.refresh(sanction)
    return sanction


# -----------------------------------------------------------------------------
# PUT /{id} - Actualizar Sanción
# -----------------------------------------------------------------------------
@router.put("/{id}", response_model=SanctionRead)
def update_sanction(
        *,
        db: Session = Depends(deps.get_db),
        id: int,
        sanction_in: SanctionUpdate,
        current_user: User = Depends(deps.get_current_active_user),
):
    if not is_contraloria_manager(current_user):
        raise HTTPException(status_code=403, detail="No tienes permisos para editar sanciones.")

    sanction = db.get(Sanction, id)
    if not sanction:
        raise HTTPException(status_code=404, detail="Sanción no encontrada")

    sanction_data = sanction_in.dict(exclude_unset=True)
    for key, value in sanction_data.items():
        setattr(sanction, key, value)

    db.add(sanction)
    db.commit()
    db.refresh(sanction)
    return sanction


# -----------------------------------------------------------------------------
# DELETE /{id} - Eliminar Sanción
# -----------------------------------------------------------------------------
# 👇 CORRECCIÓN: Quitamos el response_model
@router.delete("/{id}")
def delete_sanction(
        *,
        db: Session = Depends(deps.get_db),
        id: int,
        current_user: User = Depends(deps.get_current_active_user),
):
    if not is_contraloria_manager(current_user):
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar sanciones.")

    sanction = db.get(Sanction, id)
    if not sanction:
        raise HTTPException(status_code=404, detail="Sanción no encontrada")

    db.delete(sanction)
    db.commit()

    # 👇 CORRECCIÓN: Retornamos JSON simple
    return {"ok": True, "message": "Sanción eliminada correctamente"}