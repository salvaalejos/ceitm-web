import shutil
import os
from uuid import uuid4
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, File, UploadFile, Form
from sqlmodel import Session, select, func
from pydantic import BaseModel

from app.core.config import settings  # <--- Importamos settings para usar el DOMAIN
from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.complaint_model import Complaint, ComplaintStatus
from app.schemas.complaint_schema import ComplaintCreate, ComplaintRead
# Nota: ComplaintResolve ya no se usa en el input porque usamos Form, pero lo dejamos por si lo usas en otro lado
from app.api.deps import get_current_user
from app.core.limiter import limiter
from app.core.email_utils import send_email_background

# Definimos URL base del portal de transparencia
PORTAL_TRANSPARENCIA_URL = "https://ceitm.ddnsking.com/buzon"

router = APIRouter()


# Schema local para la respuesta pública de rastreo (Privacidad)
class ComplaintTrackPublic(BaseModel):
    tracking_code: str
    status: ComplaintStatus
    created_at: datetime
    admin_response: Optional[str] = None
    resolution_evidence_url: Optional[str] = None
    resolved_at: Optional[datetime] = None


# --- UTILIDAD: GENERAR FOLIO ---
def generate_tracking_code(session: Session) -> str:
    """Genera un folio único formato: CEITM-YYYY-XXX (Ej: CEITM-2025-001)"""
    year = datetime.now().year
    count = session.exec(select(func.count()).select_from(Complaint)).one()
    return f"CEITM-{year}-{count + 1:03d}"


# ==========================================
# 1. PÚBLICO: CREAR QUEJA (CON FOLIO)
# ==========================================
@router.post("/", response_model=ComplaintRead)
@limiter.limit("5/minute")
def create_complaint(
        request: Request,
        complaint_in: ComplaintCreate,
        session: Session = Depends(get_session)
):
    """
    Crea la queja y genera un folio de rastreo automático.
    """
    # 1. Generar Folio
    tracking_code = generate_tracking_code(session)

    # 2. Crear objeto
    complaint = Complaint.model_validate(complaint_in)
    complaint.tracking_code = tracking_code
    complaint.status = ComplaintStatus.PENDIENTE

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

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
    """
    Consulta el estatus de una queja por su folio.
    NO devuelve datos personales del alumno, solo estatus y respuesta.
    """
    statement = select(Complaint).where(Complaint.tracking_code == tracking_code.upper())
    complaint = session.exec(statement).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Folio no encontrado. Verifica tus datos.")

    return complaint


# ==========================================
# 3. PRIVADO: RESOLVER TICKET (ADMIN) + CORREO + ARCHIVOS
# ==========================================
@router.put("/{complaint_id}/resolve", response_model=ComplaintRead)
def resolve_complaint(
        complaint_id: int,
        background_tasks: BackgroundTasks,
        # -- CAMBIO: Usamos Form y File para soportar carga de archivos --
        status: str = Form(...),
        admin_response: str = Form(None),
        evidencias: List[UploadFile] = File(None),
        # ---------------------------------------------------------------
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Cierra el ticket, guarda evidencia (archivos) y notifica al usuario por correo si lo proporcionó.
    """
    # Verificación de permisos
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos para resolver tickets")

    complaint = session.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Queja no encontrada")

    # 1. Procesar Archivos (Si se enviaron)
    #    Usamos la misma lógica que en utils.py pero guardando en subcarpeta 'resoluciones'
    evidence_urls_list = []

    if evidencias:
        upload_dir = "static/uploads/resoluciones"
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        for file in evidencias:
            try:
                # Generar nombre único (Igual que en utils.py)
                file_ext = file.filename.split(".")[-1]
                unique_filename = f"{uuid4()}.{file_ext}"
                file_path = os.path.join(upload_dir, unique_filename)

                # Guardar físico
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)

                # Generar URL usando settings.DOMAIN (Igual que en utils.py)
                full_url = f"{settings.DOMAIN}/static/uploads/resoluciones/{unique_filename}"
                evidence_urls_list.append(full_url)
            except Exception as e:
                print(f"Error subiendo evidencia {file.filename}: {e}")

    # 2. Actualizar datos en BD
    # Convertimos el string status al Enum
    try:
        complaint.status = ComplaintStatus(status)
    except ValueError:
        # Si por alguna razón el string no coincide exacto, intentamos manejarlo o lanzamos error
        raise HTTPException(status_code=400, detail=f"Estado inválido: {status}")

    complaint.admin_response = admin_response
    complaint.resolved_at = datetime.utcnow()

    # Si hay nuevas evidencias, las guardamos (Concatenadas por comas si hay varias)
    if evidence_urls_list:
        joined_urls = ",".join(evidence_urls_list)
        # Si ya había algo, lo concatenamos (opcional, depende de tu lógica de negocio)
        if complaint.resolution_evidence_url:
            complaint.resolution_evidence_url += f",{joined_urls}"
        else:
            complaint.resolution_evidence_url = joined_urls

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    # --- ENVÍO DE CORREO EN SEGUNDO PLANO ---
    if complaint.email:
        email_data = {
            "name": complaint.full_name,
            "folio": complaint.tracking_code,
            "status": complaint.status.value,  # Usamos el valor actualizado del objeto
            "admin_response": complaint.admin_response,
            "evidence_url": complaint.resolution_evidence_url,
            "portal_url": PORTAL_TRANSPARENCIA_URL
        }

        send_email_background(
            background_tasks=background_tasks,
            subject=f"Actualización de Reporte: {complaint.tracking_code}",
            email_to=complaint.email,
            template_name="complaint_resolved.html",
            template_data=email_data
        )

    return complaint


# ==========================================
# 4. PRIVADO: LISTADO (FILTROS DE ROL)
# ==========================================
@router.get("/", response_model=List[ComplaintRead])
def read_complaints(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Listado interno para el Dashboard.
    """
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
# 5. PRIVADO: ELIMINAR QUEJA (ADMIN)
# ==========================================
@router.delete("/{complaint_id}", status_code=204)
def delete_complaint(
        complaint_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Elimina permanentemente una queja y sus datos asociados.
    Solo permitido para Administradores.
    """
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar tickets")

    complaint = session.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Queja no encontrada")

    session.delete(complaint)
    session.commit()
    return None