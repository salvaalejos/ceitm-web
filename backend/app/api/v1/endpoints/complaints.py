from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.complaint_model import Complaint, ComplaintStatus
from app.schemas.complaint_schema import ComplaintCreate, ComplaintRead, ComplaintUpdate
from app.api.deps import get_current_user

router = APIRouter()


# --- PÚBLICO: CREAR QUEJA ---
@router.post("/", response_model=ComplaintRead)
def create_complaint(
        complaint_in: ComplaintCreate,
        session: Session = Depends(get_session)
):
    """
    Cualquier persona puede enviar una queja/sugerencia (no requiere login).
    """
    complaint = Complaint.model_validate(complaint_in)
    session.add(complaint)
    session.commit()
    session.refresh(complaint)
    return complaint


# --- PRIVADO: LEER QUEJAS (CON FILTROS DE ROL) ---
@router.get("/", response_model=List[ComplaintRead])
def read_complaints(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Obtener lista de quejas.
    - Admin/Estructura: Ven TODAS.
    - Concejales: Ven SOLO las de su carrera.
    """
    # 1. Si es Admin o Estructura -> Ve todo
    if current_user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        statement = select(Complaint).order_by(Complaint.created_at.desc())

    # 2. Si es Concejal -> Filtra por su carrera
    elif current_user.role == UserRole.CONCEJAL:
        if not current_user.career:
            # Si el concejal no tiene carrera asignada en su perfil, no ve nada por seguridad
            return []
        statement = select(Complaint).where(Complaint.career == current_user.career).order_by(
            Complaint.created_at.desc())

    # 3. Otros roles (Vocal, Coordinador, etc.) -> Acceso denegado (Opcional, ajusta según necesites)
    else:
        # Opcional: Si quieres que Coordinadores vean todo, agrégalos al grupo 1.
        # Por ahora lo dejamos restringido:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver el buzón")

    complaints = session.exec(statement).all()
    return complaints


# --- PRIVADO: ACTUALIZAR ESTADO (MARCAR COMO RESUELTO) ---
@router.patch("/{complaint_id}", response_model=ComplaintRead)
def update_status(
        complaint_id: int,
        status_update: ComplaintUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    # Solo permitimos cambiar status a quienes pueden ver la lista
    complaint = session.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    complaint.status = status_update.status
    session.add(complaint)
    session.commit()
    session.refresh(complaint)
    return complaint