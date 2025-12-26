import shutil
import os
from uuid import uuid4
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, File, UploadFile, Form
from sqlmodel import Session, select, func
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.complaint_model import Complaint, ComplaintStatus
from app.schemas.complaint_schema import ComplaintCreate, ComplaintRead
from app.api.deps import get_current_user
from app.core.limiter import limiter
from app.core.email_utils import send_email_background

# URL base para los correos
PORTAL_TRANSPARENCIA_URL = "https://ceitm.ddnsking.com/buzon"

router = APIRouter()


# Schema local para respuesta pública (Privacidad)
class ComplaintTrackPublic(BaseModel):
    tracking_code: str
    status: ComplaintStatus
    created_at: datetime
    admin_response: Optional[str] = None
    resolution_evidence_url: Optional[str] = None
    resolved_at: Optional[datetime] = None


# --- UTILIDAD: GENERAR FOLIO ---
def generate_tracking_code(session: Session) -> str:
    """Genera un folio único formato: CEITM-YYYY-XXX"""
    year = datetime.now().year
    # Contamos cuántas quejas hay para el consecutivo
    count = session.exec(select(func.count()).select_from(Complaint)).one()
    return f"CEITM-{year}-{count + 1:03d}"


# ==========================================
# 1. PÚBLICO: CREAR QUEJA (CON FOLIO Y EVIDENCIA)
# ==========================================
@router.post("/", response_model=ComplaintRead)
@limiter.limit("5/minute")
def create_complaint(
        request: Request,
        background_tasks: BackgroundTasks,
        full_name: str = Form(...),
        control_number: str = Form(...),
        phone_number: str = Form(...),
        email: str = Form(...),
        career: str = Form(...),
        semester: str = Form(...),
        type: str = Form(...),
        description: str = Form(...),
        evidencia: UploadFile = File(None),
        session: Session = Depends(get_session)
):
    """
    Crea la queja, genera folio, sube evidencia y notifica por correo.
    """
    # 1. Generar Folio
    tracking_code = generate_tracking_code(session)

    # 2. Procesar Archivo (Si existe)
    evidence_url = None
    if evidencia:
        upload_dir = "static/uploads/quejas"
        os.makedirs(upload_dir, exist_ok=True)

        try:
            ext = evidencia.filename.split(".")[-1]
            filename = f"{uuid4()}.{ext}"
            file_path = os.path.join(upload_dir, filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(evidencia.file, buffer)

            evidence_url = f"{settings.DOMAIN}/{file_path}"
        except Exception as e:
            print(f"Error subiendo evidencia de queja: {e}")

    # 3. Crear objeto
    complaint = Complaint(
        full_name=full_name,
        control_number=control_number,
        phone_number=phone_number,
        email=email,
        career=career,
        semester=semester,
        type=type,
        description=description,
        evidence_url=evidence_url,
        tracking_code=tracking_code,
        status=ComplaintStatus.PENDIENTE
    )

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    # 4. ENVIAR CORREO DE CONFIRMACIÓN (ADAPTADO)
    if email:
        try:
            email_data = {
                "name": full_name,
                "folio": tracking_code,
                "portal_url": PORTAL_TRANSPARENCIA_URL
            }
            send_email_background(
                background_tasks=background_tasks,
                subject=f"Reporte Recibido: {tracking_code}", # Asunto más claro
                email_to=email,
                template_name="complaint_received.html",  # <--- Plantilla NUEVA correcta
                context=email_data
            )
        except Exception as e:
            print(f"Error enviando correo de confirmación: {e}")

    return complaint


# ==========================================
# 2. PÚBLICO: RASTREAR QUEJA (POR FOLIO)
# ==========================================
@router.get("/track/{tracking_code}", response_model=ComplaintTrackPublic)
@limiter.limit("10/minute")
def track_complaint(
        request: Request,
        tracking_code: str,
        session: Session = Depends(get_session)
):
    statement = select(Complaint).where(Complaint.tracking_code == tracking_code.upper())
    complaint = session.exec(statement).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Folio no encontrado.")

    return complaint


# ==========================================
# 3. PRIVADO: RESOLVER TICKET (ADMIN)
# ==========================================
@router.put("/{complaint_id}/resolve", response_model=ComplaintRead)
def resolve_complaint(
        complaint_id: int,
        background_tasks: BackgroundTasks,
        status: str = Form(...),
        admin_response: str = Form(...),
        evidencia: UploadFile = File(None),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Cierra el ticket, guarda evidencia y notifica.
    """
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos.")

    complaint = session.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Queja no encontrada")

    # 1. Procesar Archivo Resolución (Si existe)
    if evidencia:
        upload_dir = "static/uploads/resoluciones"
        os.makedirs(upload_dir, exist_ok=True)

        try:
            file_ext = evidencia.filename.split(".")[-1]
            unique_filename = f"{uuid4()}.{file_ext}"
            file_path = os.path.join(upload_dir, unique_filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(evidencia.file, buffer)

            complaint.resolution_evidence_url = f"{settings.DOMAIN}/{file_path}"
        except Exception as e:
            print(f"Error subiendo evidencia resolución: {e}")

    # 2. Actualizar Status
    try:
        complaint.status = ComplaintStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Estado inválido: {status}")

    complaint.admin_response = admin_response
    complaint.resolved_at = datetime.utcnow()

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    # 3. ENVIAR CORREO RESOLUCIÓN (ADAPTADO)
    if complaint.email:
        try:
            # Seleccionar plantilla y asunto según el dictamen
            if status == "Resuelto":
                template = "complaint_resolved.html"
                subject = f"¡Tu Reporte ha sido Atendido! - {complaint.tracking_code}"
            else: # Rechazado u otro
                template = "complaint_rejected.html"
                subject = f"Actualización de Reporte - {complaint.tracking_code}"

            email_data = {
                "name": complaint.full_name,
                "folio": complaint.tracking_code,
                "status": complaint.status.value,
                "admin_response": complaint.admin_response,
                "evidence_url": complaint.resolution_evidence_url,
                "portal_url": PORTAL_TRANSPARENCIA_URL
            }
            send_email_background(
                background_tasks=background_tasks,
                subject=subject,
                email_to=complaint.email,
                template_name=template,
                context=email_data
            )
        except Exception as e:
            print(f"Error enviando correo resolución: {e}")

    return complaint


# ==========================================
# 4. PRIVADO: LISTADO
# ==========================================
@router.get("/", response_model=List[ComplaintRead])
def read_complaints(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if current_user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        statement = select(Complaint).order_by(Complaint.created_at.desc())
    else:
        if not current_user.career:
            return []
        statement = select(Complaint).where(
            Complaint.career == current_user.career
        ).order_by(Complaint.created_at.desc())

    complaints = session.exec(statement).all()
    return complaints


# ==========================================
# 5. PRIVADO: ELIMINAR
# ==========================================
@router.delete("/{complaint_id}", status_code=204)
def delete_complaint(
        complaint_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="Sin permisos.")

    complaint = session.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Queja no encontrada")

    session.delete(complaint)
    session.commit()
    return None