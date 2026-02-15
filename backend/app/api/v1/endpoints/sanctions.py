from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api import deps
from app.models.user_model import User, UserRole, UserArea
from app.models.sanction_model import Sanction
from app.schemas.sanction_schema import SanctionCreate, SanctionRead, SanctionUpdate

router = APIRouter()


# -----------------------------------------------------------------------------
# GET / - Listar Sanciones (Con filtro de seguridad)
# -----------------------------------------------------------------------------
@router.get("/", response_model=List[SanctionRead])
def read_sanctions(
        db: Session = Depends(deps.get_db),
        current_user: User = Depends(deps.get_current_active_user),
        skip: int = 0,
        limit: int = 100,
):
    """
    Recupera sanciones.
    - Si eres Admin/Contralor: Ves TODAS.
    - Si eres Concejal: Ves SOLO LAS TUYAS.
    """
    is_admin = current_user.role == UserRole.ADMIN_SYS
    is_contraloria = current_user.area == UserArea.CONTRALORIA

    if is_admin or is_contraloria:
        # Ver todo
        statement = select(Sanction).offset(skip).limit(limit).order_by(Sanction.created_at.desc())
    else:
        # Ver solo lo mío
        statement = select(Sanction).where(Sanction.user_id == current_user.id).order_by(Sanction.created_at.desc())

    sanctions = db.exec(statement).all()
    return sanctions


# -----------------------------------------------------------------------------
# POST / - Crear Sanción (Solo Contraloría/Admin)
# -----------------------------------------------------------------------------
@router.post("/", response_model=SanctionRead)
def create_sanction(
        *,
        db: Session = Depends(deps.get_db),
        sanction_in: SanctionCreate,
        current_user: User = Depends(deps.get_current_active_user),
):
    # 1. Permisos
    is_admin = current_user.role == UserRole.ADMIN_SYS
    is_contraloria = current_user.area == UserArea.CONTRALORIA

    if not (is_admin or is_contraloria):
        raise HTTPException(status_code=403, detail="No tienes permisos para sancionar.")

    # 2. Validar usuario destino
    user = db.get(User, sanction_in.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="El usuario a sancionar no existe.")

    # 3. Crear
    sanction = Sanction.from_orm(sanction_in)
    db.add(sanction)
    db.commit()
    db.refresh(sanction)
    return sanction


# -----------------------------------------------------------------------------
# PUT /{id} - Actualizar Sanción (Estatus/Datos)
# -----------------------------------------------------------------------------
@router.put("/{id}", response_model=SanctionRead)
def update_sanction(
        *,
        db: Session = Depends(deps.get_db),
        id: int,
        sanction_in: SanctionUpdate,
        current_user: User = Depends(deps.get_current_active_user),
):
    """
    Útil para marcar como SALDADA o corregir un error.
    Solo Contraloría.
    """
    is_admin = current_user.role == UserRole.ADMIN_SYS
    is_contraloria = current_user.area == UserArea.CONTRALORIA

    if not (is_admin or is_contraloria):
        raise HTTPException(status_code=403, detail="No tienes permisos para editar sanciones.")

    sanction = db.get(Sanction, id)
    if not sanction:
        raise HTTPException(status_code=404, detail="Sanción no encontrada")

    # Actualizar campos parciales
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
@router.delete("/{id}", response_model=SanctionRead)
def delete_sanction(
        *,
        db: Session = Depends(deps.get_db),
        id: int,
        current_user: User = Depends(deps.get_current_active_user),
):
    is_admin = current_user.role == UserRole.ADMIN_SYS
    is_contraloria = current_user.area == UserArea.CONTRALORIA

    if not (is_admin or is_contraloria):
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar sanciones.")

    sanction = db.get(Sanction, id)
    if not sanction:
        raise HTTPException(status_code=404, detail="Sanción no encontrada")

    db.delete(sanction)
    db.commit()
    return sanction