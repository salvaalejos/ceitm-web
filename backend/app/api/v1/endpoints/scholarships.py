from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from datetime import datetime
import io

from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.scholarship_model import Scholarship, ScholarshipApplication, ApplicationStatus, ScholarshipQuota
from app.models.career_model import Career
from app.schemas.scholarship_schema import (
    ScholarshipCreate, ScholarshipRead, ScholarshipUpdate,
    ApplicationCreate, ApplicationRead, ApplicationUpdate, ApplicationPublicStatus,
    ScholarshipQuotaRead, ScholarshipQuotaUpdate
)
from app.api.deps import get_current_user
from app.core.limiter import limiter
from app.core.email_utils import send_email_background
from app.core.config import settings
from app.services.pdf_service import generate_scholarship_pdf

router = APIRouter()


def get_frontend_url():
    if settings.ENVIRONMENT == "development":
        return "http://localhost:5173"
    return "https://ceitm.ddnsking.com"


# ==========================================
# 1. GESTIÓN DE CUPOS (QUOTAS)
# ==========================================

@router.post("/{scholarship_id}/quotas/init", response_model=List[ScholarshipQuotaRead])
def initialize_quotas(
        scholarship_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Inicializa los cupos para todas las carreras si no existen."""
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    scholarship = session.get(Scholarship, scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=404, detail="Convocatoria no encontrada")

    careers = session.exec(select(Career).where(Career.is_active == True)).all()

    for career in careers:
        existing = session.exec(
            select(ScholarshipQuota)
            .where(ScholarshipQuota.scholarship_id == scholarship_id)
            .where(ScholarshipQuota.career_name == career.name)
        ).first()

        if not existing:
            new_quota = ScholarshipQuota(
                scholarship_id=scholarship_id,
                career_name=career.name,
                total_slots=0,
                used_slots=0
            )
            session.add(new_quota)

    session.commit()
    return session.exec(select(ScholarshipQuota).where(ScholarshipQuota.scholarship_id == scholarship_id)).all()


@router.get("/{scholarship_id}/quotas", response_model=List[ScholarshipQuotaRead])
def get_quotas(
        scholarship_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA, UserRole.CONCEJAL]:
        raise HTTPException(status_code=403, detail="No autorizado")

    return session.exec(select(ScholarshipQuota).where(ScholarshipQuota.scholarship_id == scholarship_id)).all()


@router.patch("/quotas/{quota_id}", response_model=ScholarshipQuotaRead)
def update_quota(
        quota_id: int,
        quota_in: ScholarshipQuotaUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Permite reasignar cupos dinámicamente."""
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    quota = session.get(ScholarshipQuota, quota_id)
    if not quota:
        raise HTTPException(status_code=404, detail="Cupo no encontrado")

    if quota_in.total_slots < quota.used_slots:
        raise HTTPException(
            status_code=400,
            detail=f"No puedes reducir el cupo a {quota_in.total_slots} porque ya hay {quota.used_slots} becarios aprobados."
        )

    quota.total_slots = quota_in.total_slots
    session.add(quota)
    session.commit()
    session.refresh(quota)
    return quota


# ==========================================
# 2. ENDPOINTS DE SOLICITUD (CORREGIDO)
# ==========================================

@router.post("/apply", response_model=ApplicationRead)
@limiter.limit("5/minute")
def submit_application(
        request: Request,
        application_in: ApplicationCreate,
        background_tasks: BackgroundTasks,  # <--- AGREGADO: Para enviar correos en segundo plano
        session: Session = Depends(get_session)
):
    scholarship = session.get(Scholarship, application_in.scholarship_id)
    if not scholarship or not scholarship.is_active:
        raise HTTPException(status_code=400, detail="La convocatoria no está activa")

    now = datetime.utcnow()
    if now < scholarship.start_date or now > scholarship.end_date:
        raise HTTPException(status_code=400, detail="Fuera del periodo de registro")

    existing = session.exec(
        select(ScholarshipApplication)
        .where(ScholarshipApplication.control_number == application_in.control_number)
        .where(ScholarshipApplication.scholarship_id == application_in.scholarship_id)
    ).first()

    if existing:
        if existing.status in [ApplicationStatus.DOCUMENTACION_FALTANTE, ApplicationStatus.RECHAZADA]:
            existing_data = application_in.model_dump(exclude_unset=True)
            existing.sqlmodel_update(existing_data)
            existing.status = ApplicationStatus.PENDIENTE
            existing.admin_comments = None
            session.add(existing)
            session.commit()
            session.refresh(existing)
            application = existing  # Usamos la existente para el correo
        else:
            raise HTTPException(status_code=400, detail="Ya tienes una solicitud activa.")
    else:
        # Crear nueva solicitud si no existe
        application = ScholarshipApplication.model_validate(application_in)
        session.add(application)
        session.commit()
        session.refresh(application)

    # --- NUEVO: ENVIAR CORREO DE CONFIRMACIÓN ---
    try:
        scholarship_name = scholarship.name
        frontend_link = f"{get_frontend_url()}/becas/resultados"

        send_email_background(
            background_tasks,
            subject=f"📝 Solicitud Recibida: {scholarship_name}",
            email_to=application.email,
            template_name="complaint_received.html",
            context={
                "name": application.full_name,
                "scholarship_name": scholarship_name,
                "folio": application.control_number,
                "date": now.strftime("%d/%m/%Y"),
                "portal_url": frontend_link
            }
        )
    except Exception as e:
        # Logueamos el error pero NO fallamos la solicitud HTTP, para que el alumno sí quede registrado
        print(f"⚠️ Error enviando correo de confirmación: {e}")

    return application


@router.get("/", response_model=List[ScholarshipRead])
def read_scholarships(
        active_only: bool = True,
        session: Session = Depends(get_session)
):
    query = select(Scholarship).options(selectinload(Scholarship.quotas))
    if active_only:
        query = query.where(Scholarship.is_active == True)
    return session.exec(query).all()


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


# ==========================================
# 3. ACTUALIZACIÓN DE ESTATUS Y GESTIÓN
# ==========================================

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

    if current_user.role == UserRole.CONCEJAL:
        if not current_user.career or application.career != current_user.career:
            raise HTTPException(status_code=403, detail="Solo puedes evaluar tu carrera")
    elif current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    old_status = application.status
    new_status = application_in.status

    if new_status and new_status != old_status:
        quota = session.exec(
            select(ScholarshipQuota)
            .where(ScholarshipQuota.scholarship_id == application.scholarship_id)
            .where(ScholarshipQuota.career_name == application.career)
        ).first()

        if new_status == ApplicationStatus.APROBADA:
            if not quota:
                raise HTTPException(status_code=400, detail="Cupos no definidos para esta carrera.")
            if quota.used_slots >= quota.total_slots:
                raise HTTPException(
                    status_code=400,
                    detail=f"¡CUPO LLENO! ({quota.used_slots}/{quota.total_slots})."
                )
            quota.used_slots += 1
            session.add(quota)

        elif old_status == ApplicationStatus.APROBADA and new_status != ApplicationStatus.APROBADA:
            if quota and quota.used_slots > 0:
                quota.used_slots -= 1
                session.add(quota)

    update_data = application_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(application, key, value)

    session.add(application)
    session.commit()
    session.refresh(application)

    if new_status != old_status:
        scholarship_name = application.scholarship.name if application.scholarship else "Beca CEITM"
        frontend_link = f"{get_frontend_url()}/becas/resultados"

        if new_status == ApplicationStatus.APROBADA:
            send_email_background(
                background_tasks,
                subject=f"✅ Aprobada: {scholarship_name}",
                email_to=application.email,
                template_name="accepted.html",
                context={"name": application.full_name, "scholarship_name": scholarship_name, "link": frontend_link}
            )
        elif new_status in [ApplicationStatus.RECHAZADA, ApplicationStatus.DOCUMENTACION_FALTANTE]:
            send_email_background(
                background_tasks,
                subject=f"⚠️ Actualización: {scholarship_name}",
                email_to=application.email,
                template_name="rejected.html",
                context={"name": application.full_name, "scholarship_name": scholarship_name,
                         "observations": application.admin_comments, "link": frontend_link}
            )

    return application


# --- NUEVO: DESCARGAR EXPEDIENTE PDF ---
@router.get("/applications/{application_id}/download")
async def download_application_pdf(
        application_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """
    Genera y descarga el expediente digital unificado (Solicitud + Evidencias).
    """
    # 1. Verificar Permisos (Solo Admin, Estructura o el propio alumno si quisiéramos)
    # Por ahora solo Staff para revisión
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA, UserRole.CONCEJAL]:
        raise HTTPException(status_code=403, detail="No autorizado para descargar expedientes.")

    # 2. Obtener Solicitud
    application = session.get(ScholarshipApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    # Si es concejal, verificar carrera
    if current_user.role == UserRole.CONCEJAL:
        if application.career != current_user.career:
            raise HTTPException(status_code=403, detail="Solo puedes ver expedientes de tu carrera.")

    # 3. Generar PDF
    try:
        pdf_bytes = await generate_scholarship_pdf(application)
    except Exception as e:
        print(f"Error generando PDF: {e}")
        raise HTTPException(status_code=500, detail="Error al generar el documento PDF.")

    # 4. Retornar como Stream (Descarga)
    filename = f"Expediente_{application.control_number}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/status/{control_number}", response_model=List[ApplicationPublicStatus])
@limiter.limit("5/minute")
def check_application_status(
        request: Request,
        control_number: str,
        session: Session = Depends(get_session)
):
    return session.exec(
        select(ScholarshipApplication)
        .where(ScholarshipApplication.control_number == control_number)
        .order_by(ScholarshipApplication.created_at.desc())
    ).all()