from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.database import get_session
from app.models.convenio_model import Convenio, ConvenioCreate, ConvenioRead

from app.api.deps import get_current_user
from app.models.user_model import User
from app.core.audit_logger import log_action

router = APIRouter()


# 👇 NUEVO: Esquema de Paginación
class PaginatedConvenios(BaseModel):
    total: int
    items: List[ConvenioRead]


# ==========================================
# 1. PÚBLICO: OBTENER TODOS LOS CONVENIOS (Lista plana)
# ==========================================
@router.get("/all", response_model=List[ConvenioRead])
def read_all_convenios(session: Session = Depends(get_session)):
    """
    Endpoint para la página pública. Devuelve todos los convenios sin paginar.
    """
    convenios = session.exec(select(Convenio).order_by(Convenio.nombre)).all()
    return convenios


# ==========================================
# 2. PRIVADO: OBTENER CONVENIOS PAGINADOS Y BÚSQUEDA
# ==========================================
@router.get("/", response_model=PaginatedConvenios)
def read_convenios_paginated(
        skip: int = Query(0, ge=0),
        limit: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(None),
        session: Session = Depends(get_session)
):
    base_query = select(Convenio)

    if search:
        base_query = base_query.where(
            (Convenio.nombre.icontains(search)) |
            (Convenio.categoria.icontains(search)) |
            (Convenio.descripcion.icontains(search))
        )

    # Contamos total de registros
    all_matching = session.exec(base_query).all()
    total = len(all_matching)

    # Paginamos
    query = base_query.order_by(Convenio.id.desc()).offset(skip).limit(limit)
    convenios = session.exec(query).all()

    return PaginatedConvenios(total=total, items=convenios)


# ==========================================
# 3. PRIVADO: CREAR CONVENIO
# ==========================================
@router.post("/", response_model=ConvenioRead)
def create_convenio(
        convenio: ConvenioCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    db_convenio = Convenio.model_validate(convenio)
    session.add(db_convenio)
    session.commit()
    session.refresh(db_convenio)

    log_action(
        session=session,
        user=current_user,
        action="CREATE",
        module="CONVENIOS",
        details=f"Creó el convenio: {db_convenio.nombre}",
        resource_id=str(db_convenio.id)
    )
    session.commit()
    return db_convenio


# ==========================================
# 4. PÚBLICO/PRIVADO: OBTENER CONVENIO POR ID
# ==========================================
@router.get("/{convenio_id}", response_model=ConvenioRead)
def read_convenio(convenio_id: int, session: Session = Depends(get_session)):
    convenio = session.get(Convenio, convenio_id)
    if not convenio:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")
    return convenio


# ==========================================
# 5. PRIVADO: ELIMINAR CONVENIO
# ==========================================
@router.delete("/{convenio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_convenio(
        convenio_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    convenio = session.get(Convenio, convenio_id)
    if not convenio:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")

    nombre_eliminado = convenio.nombre
    session.delete(convenio)

    log_action(
        session=session,
        user=current_user,
        action="DELETE",
        module="CONVENIOS",
        details=f"Eliminó el convenio: {nombre_eliminado}",
        resource_id=str(convenio_id)
    )
    session.commit()
    return None


# ==========================================
# 6. PRIVADO: ACTUALIZAR CONVENIO
# ==========================================
@router.put("/{convenio_id}", response_model=Convenio)
def update_convenio(
        convenio_id: int,
        convenio_data: ConvenioCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    db_convenio = session.get(Convenio, convenio_id)
    if not db_convenio:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")

    data = convenio_data.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_convenio, key, value)

    session.add(db_convenio)
    session.commit()
    session.refresh(db_convenio)

    log_action(
        session=session,
        user=current_user,
        action="UPDATE",
        module="CONVENIOS",
        details=f"Actualizó datos del convenio: {db_convenio.nombre}",
        resource_id=str(db_convenio.id)
    )
    session.commit()
    return db_convenio