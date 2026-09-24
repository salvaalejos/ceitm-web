import hashlib
import io
import secrets
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlmodel import Session, SQLModel, select

from app.api.deps import get_current_active_user
from app.core.audit_logger import log_action
from app.core.config import settings
from app.core.database import get_session
from app.models.firma_digital_model import FirmaDigital
from app.models.justificante_model import (
    Justificante,
    JustificanteCreate,
    JustificanteEstado,
    JustificanteParticipante,
    JustificanteRead,
    JustificanteTipo,
)
from app.models.user_model import User, UserRole
from app.services.justificante_pdf_service import generate_justificante_pdf, qr_url_for_token

router = APIRouter()


class PaginatedJustificantes(SQLModel):
    total: int
    items: List[JustificanteRead]


class RechazoRequest(SQLModel):
    motivo_rechazo: str


# ----------------------------------------------------------------------------
# PERMISOS
# ----------------------------------------------------------------------------
def is_estructura(user: User) -> bool:
    return user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]


def _check_estructura(user: User):
    if not is_estructura(user):
        raise HTTPException(
            status_code=403,
            detail="Solo Estructura o Administración puede gestionar aprobaciones de justificantes.",
        )


def _check_owner_or_estructura(j: Justificante, user: User):
    if j.created_by_id != user.id and not is_estructura(user):
        raise HTTPException(status_code=403, detail="No tienes acceso a este justificante.")


def _to_read(session: Session, j: Justificante) -> JustificanteRead:
    creador = session.get(User, j.created_by_id) if j.created_by_id else None
    aprobador = session.get(User, j.approved_by_id) if j.approved_by_id else None
    return JustificanteRead(
        id=j.id,
        tipo=j.tipo.value,
        actividad=j.actividad,
        fecha=j.fecha,
        hora_inicio=j.hora_inicio,
        hora_fin=j.hora_fin,
        folio=j.folio,
        participantes=[JustificanteParticipante(**p) for p in (j.participantes or [])],
        estado=j.estado.value,
        motivo_rechazo=j.motivo_rechazo,
        created_by_id=j.created_by_id,
        approved_by_id=j.approved_by_id,
        approved_at=j.approved_at,
        sello_digital=j.sello_digital,
        qr_token=j.qr_token,
        created_at=j.created_at,
        creador=creador.full_name if creador else None,
        aprobador=aprobador.full_name if aprobador else None,
    )


def _validate_payload(payload: JustificanteCreate):
    if not payload.actividad.strip():
        raise HTTPException(status_code=400, detail="La actividad realizada es obligatoria.")
    if not payload.folio.strip():
        raise HTTPException(status_code=400, detail="El folio (número de oficio) es obligatorio.")
    if payload.hora_inicio >= payload.hora_fin:
        raise HTTPException(status_code=400, detail="La hora de inicio debe ser anterior a la hora final.")
    if not payload.participantes:
        raise HTTPException(status_code=400, detail="Debes registrar al menos un participante.")
    if payload.tipo == JustificanteTipo.INDIVIDUAL and len(payload.participantes) != 1:
        raise HTTPException(status_code=400, detail="El justificante individual requiere exactamente un participante.")
    for p in payload.participantes:
        if not p.nombre.strip() or not p.numero_control.strip() or not p.carrera.strip():
            raise HTTPException(
                status_code=400,
                detail="Todos los participantes deben tener nombre, número de control y carrera.",
            )


# ----------------------------------------------------------------------------
# GET / - Mis justificantes (solo los que el usuario creó)
# ----------------------------------------------------------------------------
@router.get("/", response_model=PaginatedJustificantes)
def read_mis_justificantes(
        estado: Optional[JustificanteEstado] = Query(None),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=500),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    base = select(Justificante).where(Justificante.created_by_id == current_user.id)
    if estado:
        base = base.where(Justificante.estado == estado)

    total = session.exec(
        select(func.count()).select_from(base.subquery())
    ).one()

    items = session.exec(
        base.order_by(Justificante.created_at.desc()).offset(skip).limit(limit)
    ).all()

    return PaginatedJustificantes(total=total, items=[_to_read(session, j) for j in items])


# ----------------------------------------------------------------------------
# GET /aprobaciones - Lista para revisión (Solo Estructura/Admin)
# ----------------------------------------------------------------------------
@router.get("/aprobaciones", response_model=PaginatedJustificantes)
def read_aprobaciones(
        estado: Optional[JustificanteEstado] = Query(None),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=500),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    _check_estructura(current_user)

    base = select(Justificante)
    if estado:
        base = base.where(Justificante.estado == estado)

    total = session.exec(
        select(func.count()).select_from(base.subquery())
    ).one()

    items = session.exec(
        base.order_by(Justificante.created_at.desc()).offset(skip).limit(limit)
    ).all()

    return PaginatedJustificantes(total=total, items=[_to_read(session, j) for j in items])


# ----------------------------------------------------------------------------
# GET /publico/{qr_token} - Página de verificación (target del QR, sin auth)
# ----------------------------------------------------------------------------
@router.get("/publico/{qr_token}", response_model=JustificanteRead)
def read_justificante_publico(
        qr_token: str,
        session: Session = Depends(get_session),
):
    j = session.exec(select(Justificante).where(Justificante.qr_token == qr_token)).first()
    if not j or j.estado != JustificanteEstado.APROBADO:
        raise HTTPException(status_code=404, detail="Justificante no encontrado o aún no aprobado.")
    return _to_read(session, j)


# ----------------------------------------------------------------------------
# GET /firma/mia - Firma guardada del usuario autenticado
# ----------------------------------------------------------------------------
@router.get("/firma/mia", response_model=dict)
def get_mi_firma(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    firma = session.exec(select(FirmaDigital).where(FirmaDigital.user_id == current_user.id)).first()
    return {
        "imagen_url": firma.imagen_url if firma else None,
        "updated_at": firma.updated_at.isoformat() if firma else None,
    }


# ----------------------------------------------------------------------------
# POST /firma - Subir/actualizar la firma digital del usuario (Solo Estructura/Admin)
# ----------------------------------------------------------------------------
@router.post("/firma", response_model=dict)
def upload_firma(
        file: UploadFile = File(...),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    _check_estructura(current_user)

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="La firma debe ser un archivo de imagen (PNG/JPEG).")

    ext = (file.filename.split(".")[-1] or "png").lower()
    if ext not in ("png", "jpg", "jpeg", "webp"):
        raise HTTPException(status_code=400, detail="Formato de imagen no soportado (usa PNG o JPG).")

    upload_dir = Path("static/uploads/firmas")
    upload_dir.mkdir(parents=True, exist_ok=True)

    unique_name = f"{uuid4()}.{ext}"
    dest = upload_dir / unique_name
    with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    url = f"{settings.DOMAIN}/static/uploads/firmas/{unique_name}"

    existing = session.exec(select(FirmaDigital).where(FirmaDigital.user_id == current_user.id)).first()
    accion = "UPDATE"
    if existing:
        existing.imagen_url = url
        existing.updated_at = datetime.utcnow()
        session.add(existing)
    else:
        accion = "CREATE"
        existing = FirmaDigital(user_id=current_user.id, imagen_url=url)
        session.add(existing)

    session.commit()
    session.refresh(existing)

    log_action(session, current_user, accion, "FIRMAS", "Subió/actualizó su firma digital", str(current_user.id))
    session.commit()

    return {"imagen_url": existing.imagen_url, "updated_at": existing.updated_at.isoformat()}


# ----------------------------------------------------------------------------
# POST / - Crear justificante (cualquier usuario autenticado)
# ----------------------------------------------------------------------------
@router.post("/", response_model=JustificanteRead)
def create_justificante(
        payload: JustificanteCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    _validate_payload(payload)

    j = Justificante(
        tipo=payload.tipo,
        actividad=payload.actividad.strip(),
        fecha=payload.fecha,
        hora_inicio=payload.hora_inicio,
        hora_fin=payload.hora_fin,
        folio=payload.folio.strip(),
        participantes=[p.model_dump() for p in payload.participantes],
        created_by_id=current_user.id,
    )
    session.add(j)
    session.commit()
    session.refresh(j)

    log_action(session, current_user, "CREATE", "JUSTIFICANTES", f"Creó justificante {payload.tipo.value} '{j.folio}'", str(j.id))
    session.commit()

    return _to_read(session, j)


# ----------------------------------------------------------------------------
# POST /{id}/aprobar - Aprobar (Solo Estructura/Admin, requiere firma guardada)
# ----------------------------------------------------------------------------
@router.post("/{justificante_id}/aprobar", response_model=JustificanteRead)
def aprobar_justificante(
        justificante_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    _check_estructura(current_user)

    j = session.get(Justificante, justificante_id)
    if not j:
        raise HTTPException(status_code=404, detail="Justificante no encontrado.")
    if j.estado != JustificanteEstado.PENDIENTE:
        raise HTTPException(status_code=400, detail="Este justificante ya no está pendiente de aprobación.")

    firma = session.exec(select(FirmaDigital).where(FirmaDigital.user_id == current_user.id)).first()
    if not firma:
        raise HTTPException(status_code=400, detail="Primero sube tu firma digital para poder aprobar.")

    approved_at = datetime.utcnow()
    raw = f"{j.id}:{j.folio}:{j.actividad}:{j.fecha.isoformat()}:{approved_at.isoformat()}"
    sello = "CEITM-SELLO-" + hashlib.sha256(raw.encode()).hexdigest().upper()[:16]

    j.estado = JustificanteEstado.APROBADO
    j.approved_by_id = current_user.id
    j.approved_at = approved_at
    j.sello_digital = sello
    j.qr_token = secrets.token_urlsafe(24)

    session.add(j)
    session.commit()
    session.refresh(j)

    log_action(session, current_user, "UPDATE", "JUSTIFICANTES", f"Aprobó justificante {j.id} (sello {sello})", str(j.id))
    session.commit()

    return _to_read(session, j)


# ----------------------------------------------------------------------------
# POST /{id}/rechazar - Rechazar (Solo Estructura/Admin)
# ----------------------------------------------------------------------------
@router.post("/{justificante_id}/rechazar", response_model=JustificanteRead)
def rechazar_justificante(
        justificante_id: int,
        payload: RechazoRequest,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    _check_estructura(current_user)

    j = session.get(Justificante, justificante_id)
    if not j:
        raise HTTPException(status_code=404, detail="Justificante no encontrado.")
    if j.estado != JustificanteEstado.PENDIENTE:
        raise HTTPException(status_code=400, detail="Este justificante ya no está pendiente de aprobación.")
    if not payload.motivo_rechazo.strip():
        raise HTTPException(status_code=400, detail="Debes indicar el motivo del rechazo.")

    j.estado = JustificanteEstado.RECHAZADO
    j.motivo_rechazo = payload.motivo_rechazo.strip()

    session.add(j)
    session.commit()
    session.refresh(j)

    log_action(session, current_user, "UPDATE", "JUSTIFICANTES", f"Rechazó justificante {j.id}: {j.motivo_rechazo}", str(j.id))
    session.commit()

    return _to_read(session, j)


# ----------------------------------------------------------------------------
# GET /{id}/pdf - Descargar PDF del justificante (solo si está aprobado)
# ----------------------------------------------------------------------------
@router.get("/{justificante_id}/pdf")
def download_justificante_pdf(
        justificante_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    j = session.get(Justificante, justificante_id)
    if not j:
        raise HTTPException(status_code=404, detail="Justificante no encontrado.")

    _check_owner_or_estructura(j, current_user)

    if j.estado != JustificanteEstado.APROBADO:
        raise HTTPException(status_code=409, detail="El PDF solo está disponible para justificantes aprobados.")

    aprobador = session.get(User, j.approved_by_id) if j.approved_by_id else None
    if not aprobador:
        raise HTTPException(status_code=409, detail="No se encontró el aprobador del justificante.")

    firma = session.exec(select(FirmaDigital).where(FirmaDigital.user_id == aprobador.id)).first()
    firma_url = firma.imagen_url if firma else None

    pdf_bytes = generate_justificante_pdf(j, aprobador, firma_url, qr_url_for_token(j.qr_token))

    filename = f"Justificante_{j.tipo.value.capitalize()}_{j.id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ----------------------------------------------------------------------------
# GET /{id} - Detalle (creador o Estructura/Admin)
# ----------------------------------------------------------------------------
@router.get("/{justificante_id}", response_model=JustificanteRead)
def read_justificante(
        justificante_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    j = session.get(Justificante, justificante_id)
    if not j:
        raise HTTPException(status_code=404, detail="Justificante no encontrado.")
    _check_owner_or_estructura(j, current_user)
    return _to_read(session, j)