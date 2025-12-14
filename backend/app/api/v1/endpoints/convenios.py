from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
# Importamos las 3 clases que definimos arriba
from app.models.convenio_model import Convenio, ConvenioCreate, ConvenioRead

router = APIRouter()

# 1. OBTENER TODOS LOS CONVENIOS (GET)
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
    session: Session = Depends(get_session)
):
    # Convertimos el esquema ConvenioCreate al modelo de tabla Convenio
    db_convenio = Convenio.model_validate(convenio)
    session.add(db_convenio)
    session.commit()
    session.refresh(db_convenio)
    return db_convenio

# 3. OBTENER UN CONVENIO POR ID
@router.get("/{convenio_id}", response_model=ConvenioRead)
def read_convenio(convenio_id: int, session: Session = Depends(get_session)):
    convenio = session.get(Convenio, convenio_id)
    if not convenio:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")
    return convenio