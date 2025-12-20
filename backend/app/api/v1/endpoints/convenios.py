from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.database import get_session

# Importamos las 3 clases que definimos arriba
from app.models.convenio_model import Convenio, ConvenioCreate, ConvenioRead

# 👇 NUEVOS IMPORTS PARA AUDITORÍA Y SEGURIDAD
from app.api.deps import get_current_user
from app.models.user_model import User
from app.core.audit_logger import log_action

router = APIRouter()


# 1. OBTENER TODOS LOS CONVENIOS (GET)
# (Este se queda igual, sin log porque es solo lectura)
@router.get("/", response_model=List[ConvenioRead])
def read_convenios(
        skip: int = 0,
        limit: int = 100,
        session: Session = Depends(get_session)
):
    convenios = session.exec(select(Convenio).offset(skip).limit(limit)).all()
    return convenios


# 2. CREAR UN CONVENIO (POST)
@router.post("/", response_model=ConvenioRead)
def create_convenio(
        convenio: ConvenioCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)  # 👈 Necesario para saber quién crea
):
    # Convertimos el esquema ConvenioCreate al modelo de tabla Convenio
    db_convenio = Convenio.model_validate(convenio)
    session.add(db_convenio)
    session.commit()
    session.refresh(db_convenio)

    # 👇 LOG DE AUDITORÍA
    log_action(
        session=session,
        user=current_user,
        action="CREATE",
        module="CONVENIOS",
        details=f"Creó el convenio: {db_convenio.nombre}",
        resource_id=str(db_convenio.id)
    )
    session.commit()  # Guardamos el log

    return db_convenio


# 3. OBTENER UN CONVENIO POR ID
@router.get("/{convenio_id}", response_model=ConvenioRead)
def read_convenio(convenio_id: int, session: Session = Depends(get_session)):
    convenio = session.get(Convenio, convenio_id)
    if not convenio:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")
    return convenio


# 4. ELIMINAR UN CONVENIO POR ID
@router.delete("/{convenio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_convenio(
        convenio_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)  # 👈 Necesario para el log
):
    convenio = session.get(Convenio, convenio_id)
    if not convenio:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")

    nombre_eliminado = convenio.nombre  # Guardamos el nombre antes de borrar

    session.delete(convenio)

    # 👇 LOG DE AUDITORÍA
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


# UPDATE CONVENIOS
@router.put("/{convenio_id}", response_model=Convenio)
def update_convenio(
        convenio_id: int,
        convenio_data: ConvenioCreate,  # Usamos el mismo esquema que para crear
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)  # 👈 Necesario para el log
):
    # 1. Buscar el convenio existente
    db_convenio = session.get(Convenio, convenio_id)
    if not db_convenio:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")

    # 2. Actualizar solo los campos enviados
    data = convenio_data.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_convenio, key, value)

    # 3. Guardar cambios
    session.add(db_convenio)
    session.commit()
    session.refresh(db_convenio)

    # 👇 LOG DE AUDITORÍA
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