from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.career_model import Career
from app.schemas.career_schema import CareerCreate, CareerRead, CareerUpdate
from app.api.deps import get_current_user

router = APIRouter()


# --- PÚBLICO: LISTAR CARRERAS ---
@router.get("/", response_model=List[CareerRead])
def read_careers(
        session: Session = Depends(get_session),
        active_only: bool = False  # Cambiamos a False por defecto para que el Admin vea todas
):
    query = select(Career)
    if active_only:
        query = query.where(Career.is_active == True)

    # Ordenar alfabéticamente
    query = query.order_by(Career.name)
    careers = session.exec(query).all()
    return careers


# --- ADMIN: CREAR CARRERA ---
@router.post("/", response_model=CareerRead)
def create_career(
        career_in: CareerCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    career = Career.model_validate(career_in)
    session.add(career)
    session.commit()
    session.refresh(career)
    return career


# --- ADMIN/CONCEJAL: ACTUALIZAR ---
@router.patch("/{career_id}", response_model=CareerRead)
def update_career(
        career_id: int,
        career_in: CareerUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    career = session.get(Career, career_id)
    if not career:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")

    # --- LÓGICA DE PERMISOS ---

    # CASO 1: Admin o Estructura -> Pueden hacer TODO
    if current_user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        pass

        # CASO 2: Concejal -> Solo SU carrera y restricciones
    elif current_user.role == UserRole.CONCEJAL:
        # Validación A: ¿Es su carrera?
        if current_user.career != career.name:
            raise HTTPException(status_code=403, detail="Solo puedes editar tu propia carrera")

        # Validación B: ¿Intenta cambiar el estatus? (PROHIBIDO)
        # Si envía is_active y es diferente al actual, error.
        if career_in.is_active is not None and career_in.is_active != career.is_active:
            raise HTTPException(status_code=403, detail="No tienes permiso para desactivar la carrera")

        # Validación C: ¿Intenta cambiar el nombre? (PROHIBIDO)
        if career_in.name is not None and career_in.name != career.name:
            raise HTTPException(status_code=403, detail="No tienes permiso para renombrar la carrera")

    # CASO 3: Cualquier otro -> Fuera
    else:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    # Aplicar cambios
    update_data = career_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(career, key, value)

    session.add(career)
    session.commit()
    session.refresh(career)
    return career