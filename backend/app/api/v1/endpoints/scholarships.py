from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlmodel import Session, select
from datetime import datetime

from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.scholarship_model import Scholarship, ScholarshipApplication, ApplicationStatus
from app.schemas.scholarship_schema import (
    ScholarshipCreate, ScholarshipRead, ScholarshipUpdate,
    ApplicationCreate, ApplicationRead, ApplicationUpdate, ApplicationPublicStatus
)
from app.api.deps import get_current_user
from app.core.limiter import limiter
from app.core.email_utils import send_email_background
from app.core.config import settings

router = APIRouter()


def get_frontend_url():
    if settings.ENVIRONMENT == "development":
        return "http://localhost:5173"
    return "https://ceitm.ddnsking.com"


# --- PÚBLICO: ENVIAR (O CORREGIR) SOLICITUD ---
@router.post("/apply", response_model=ApplicationRead)
@limiter.limit("5/minute")
def submit_application(
        request: Request,
        application_in: ApplicationCreate,
        session: Session = Depends(get_session)
):
    """
    Enviar solicitud de beca.
    - Si es NUEVA: Crea el registro.
    - Si YA EXISTE y tiene estatus 'Documentación Faltante' o 'Rechazada': ACTUALIZA la info y la pone en 'Pendiente'.
    - Si YA EXISTE y está 'Pendiente' o 'Aprobada': Bloquea (Error 400).
    """
    # 1. Verificar Beca
    scholarship = session.get(Scholarship, application_in.scholarship_id)
    if not scholarship or not scholarship.is_active:
        raise HTTPException(status_code=400, detail="La convocatoria no está activa")

    # 2. Verificar Fechas
    now = datetime.utcnow()
    if now < scholarship.start_date or now > scholarship.end_date:
        raise HTTPException(status_code=400, detail="Fuera del periodo de registro")

    # 3. BUSCAR EXISTENCIA
    existing = session.exec(
        select(ScholarshipApplication)
        .where(ScholarshipApplication.control_number == application_in.control_number)
        .where(ScholarshipApplication.scholarship_id == application_in.scholarship_id)
    ).first()

    # --- LÓGICA DE REENVÍO ---
    if existing:
        # Solo permitimos re-enviar si le pidieron correcciones o fue rechazada (y quiere intentar de nuevo)
        if existing.status in [ApplicationStatus.DOCUMENTACION_FALTANTE, ApplicationStatus.RECHAZADA]:

            # Actualizamos los campos con la nueva info del formulario
            existing_data = application_in.model_dump(exclude_unset=True)
            existing.sqlmodel_update(existing_data)

            # IMPORTANTE: Reiniciar estatus a PENDIENTE para que aparezca en el inbox del Admin
            existing.status = ApplicationStatus.PENDIENTE
            existing.admin_comments = None  # Limpiamos comentarios viejos

            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

        else:
            # Si ya está Pendiente o Aprobada, no dejamos duplicar
            raise HTTPException(status_code=400,
                                detail="Ya tienes una solicitud activa para esta beca. Espera resultados.")

    # 4. CREAR NUEVA (Si no existía)
    application = ScholarshipApplication.model_validate(application_in)
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


# --- PÚBLICO: LISTAR CONVOCATORIAS ---
@router.get("/", response_model=List[ScholarshipRead])
def read_scholarships(
        active_only: bool = True,
        session: Session = Depends(get_session)
):
    query = select(Scholarship)
    if active_only:
        query = query.where(Scholarship.is_active == True)
    return session.exec(query).all()


# --- PRIVADO: GESTIÓN DE CONVOCATORIAS (ADMIN) ---
@router.post("/", response_model=ScholarshipRead)
def create_scholarship(
        scholarship_in: ScholarshipCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    scholarship = Scholarship.model_validate(scholarship_in)
    session.add(scholarship)
    session.commit()
    session.refresh(scholarship)
    return scholarship


# --- PRIVADO: REVISIÓN (CONCEJALES/ADMIN) ---
@router.get("/applications", response_model=List[ApplicationRead])
def read_all_applications(
        scholarship_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    query = select(ScholarshipApplication).where(ScholarshipApplication.scholarship_id == scholarship_id)

    if current_user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        pass
    elif current_user.role == UserRole.CONCEJAL:
        if not current_user.career:
            return []
        query = query.where(ScholarshipApplication.career == current_user.career)
    else:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    return session.exec(query).all()


# --- PRIVADO: ACTUALIZAR CONVOCATORIA (ADMIN) ---
@router.patch("/{scholarship_id}", response_model=ScholarshipRead)
def update_scholarship(
        scholarship_id: int,
        scholarship_in: ScholarshipUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    scholarship = session.get(Scholarship, scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=404, detail="Convocatoria no encontrada")

    scholarship_data = scholarship_in.model_dump(exclude_unset=True)
    for key, value in scholarship_data.items():
        setattr(scholarship, key, value)

    session.add(scholarship)
    session.commit()
    session.refresh(scholarship)
    return scholarship


# --- PRIVADO: ACTUALIZAR ESTATUS (CON CORREO) ---
@router.patch("/applications/{application_id}", response_model=ApplicationRead)
def update_application_status(
        application_id: int,
        application_in: ApplicationUpdate,
        background_tasks: BackgroundTasks,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    application = session.get(ScholarshipApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if current_user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        pass
    elif current_user.role == UserRole.CONCEJAL:
        if not current_user.career or application.career != current_user.career:
            raise HTTPException(status_code=403, detail="Solo puedes evaluar tu carrera")
    else:
        raise HTTPException(status_code=403, detail="No autorizado")

    old_status = application.status
    new_status = application_in.status

    update_data = application_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(application, key, value)

    session.add(application)
    session.commit()
    session.refresh(application)

    # Enviar correo si cambió el estatus
    if new_status and new_status != old_status:
        session.refresh(application)  # Recargar relaciones
        scholarship_name = application.scholarship.name if application.scholarship else "Beca CEITM"
        frontend_link = f"{get_frontend_url()}/becas/resultados"

        if new_status == ApplicationStatus.APROBADA:
            send_email_background(
                background_tasks,
                subject=f"✅ Beca Aprobada: {scholarship_name}",
                email_to=application.email,
                template_name="accepted.html",
                context={
                    "name": application.full_name,
                    "scholarship_name": scholarship_name,
                    "folio": application.control_number,
                    "link": frontend_link
                }
            )

        elif new_status in [ApplicationStatus.RECHAZADA, ApplicationStatus.DOCUMENTACION_FALTANTE]:
            subject_prefix = "❌ Solicitud Rechazada" if new_status == ApplicationStatus.RECHAZADA else "⚠️ Acción Requerida"
            observations = application.admin_comments or "Revisa los detalles en la plataforma."

            send_email_background(
                background_tasks,
                subject=f"{subject_prefix}: {scholarship_name}",
                email_to=application.email,
                template_name="rejected.html",
                context={
                    "name": application.full_name,
                    "scholarship_name": scholarship_name,
                    "folio": application.control_number,
                    "observations": observations,
                    "link": frontend_link
                }
            )

    return application


# --- PÚBLICO: CONSULTAR ESTATUS ---
@router.get("/status/{control_number}", response_model=List[ApplicationPublicStatus])
@limiter.limit("5/minute")
def check_application_status(
        request: Request,
        control_number: str,
        session: Session = Depends(get_session)
):
    applications = session.exec(
        select(ScholarshipApplication)
        .where(ScholarshipApplication.control_number == control_number)
        .order_by(ScholarshipApplication.created_at.desc())
    ).all()

    return applications