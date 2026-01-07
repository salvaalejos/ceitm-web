from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlmodel import Session, select
from datetime import datetime

from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.scholarship_model import Scholarship, ScholarshipApplication, ApplicationStatus, ScholarshipQuota
from app.models.career_model import Career  # Necesario para inicializar cupos
from app.schemas.scholarship_schema import (
    ScholarshipCreate, ScholarshipRead, ScholarshipUpdate,
    ApplicationCreate, ApplicationRead, ApplicationUpdate, ApplicationPublicStatus,
    ScholarshipQuotaRead, ScholarshipQuotaUpdate
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


# ==========================================
# 1. GESTIÓN DE CUPOS (QUOTAS) - NUEVO
# ==========================================

@router.post("/{scholarship_id}/quotas/init", response_model=List[ScholarshipQuotaRead])
def initialize_quotas(
        scholarship_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """
    Inicializa los cupos para todas las carreras activas en 0.
    Útil cuando se acaba de crear una convocatoria.
    """
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    scholarship = session.get(Scholarship, scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=404, detail="Convocatoria no encontrada")

    # Obtener todas las carreras activas
    careers = session.exec(select(Career).where(Career.is_active == True)).all()

    quotas_created = []
    for career in careers:
        # Verificar si ya existe cupo para esta carrera en esta beca
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
            quotas_created.append(new_quota)

    session.commit()
    # Retornamos todos los cupos de la beca
    return session.exec(select(ScholarshipQuota).where(ScholarshipQuota.scholarship_id == scholarship_id)).all()


@router.get("/{scholarship_id}/quotas", response_model=List[ScholarshipQuotaRead])
def get_quotas(
        scholarship_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Obtiene la matriz de cupos (Carrera | Total | Usados | Disponibles)"""
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA, UserRole.CONCEJAL]:
        raise HTTPException(status_code=403, detail="No autorizado")

    quotas = session.exec(select(ScholarshipQuota).where(ScholarshipQuota.scholarship_id == scholarship_id)).all()
    return quotas


@router.patch("/quotas/{quota_id}", response_model=ScholarshipQuotaRead)
def update_quota(
        quota_id: int,
        quota_in: ScholarshipQuotaUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """
    Permite al Coordinador mover cupos (Reasignación Dinámica).
    Validación: No puedes reducir el total por debajo de lo que ya se usó (aprobados).
    """
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    quota = session.get(ScholarshipQuota, quota_id)
    if not quota:
        raise HTTPException(status_code=404, detail="Cupo no encontrado")

    # VALIDACIÓN DE INTEGRIDAD
    if quota_in.total_slots < quota.used_slots:
        raise HTTPException(
            status_code=400,
            detail=f"No puedes reducir el cupo a {quota_in.total_slots} porque ya hay {quota.used_slots} becarios aprobados en esta carrera."
        )

    quota.total_slots = quota_in.total_slots
    session.add(quota)
    session.commit()
    session.refresh(quota)
    return quota


# ==========================================
# 2. ENDPOINTS DE SOLICITUD (EXISTENTES + MEJORAS)
# ==========================================

@router.post("/apply", response_model=ApplicationRead)
@limiter.limit("5/minute")
def submit_application(
        request: Request,
        application_in: ApplicationCreate,
        session: Session = Depends(get_session)
):
    """
    Enviar solicitud de beca (Público).
    El Schema ya valida los campos nuevos (Folio, Promedios, Documentos).
    """
    # 1. Verificar Beca
    scholarship = session.get(Scholarship, application_in.scholarship_id)
    if not scholarship or not scholarship.is_active:
        raise HTTPException(status_code=400, detail="La convocatoria no está activa")

    # 2. Verificar Fechas
    now = datetime.utcnow()
    if now < scholarship.start_date or now > scholarship.end_date:
        raise HTTPException(status_code=400, detail="Fuera del periodo de registro")

    # 3. BUSCAR EXISTENCIA (Evitar duplicados)
    existing = session.exec(
        select(ScholarshipApplication)
        .where(ScholarshipApplication.control_number == application_in.control_number)
        .where(ScholarshipApplication.scholarship_id == application_in.scholarship_id)
    ).first()

    if existing:
        # Permitir reenvío solo si se requieren correcciones
        if existing.status in [ApplicationStatus.DOCUMENTACION_FALTANTE, ApplicationStatus.RECHAZADA]:
            existing_data = application_in.model_dump(exclude_unset=True)
            existing.sqlmodel_update(existing_data)
            existing.status = ApplicationStatus.PENDIENTE
            existing.admin_comments = None
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
        else:
            raise HTTPException(status_code=400, detail="Ya tienes una solicitud activa. Espera resultados.")

    # 4. CREAR NUEVA
    application = ScholarshipApplication.model_validate(application_in)

    # IMPORTANTE: Normalizar carrera (opcional, para asegurar match con Quotas)
    # application.career = application.career.strip()

    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@router.get("/", response_model=List[ScholarshipRead])
def read_scholarships(
        active_only: bool = True,
        session: Session = Depends(get_session)
):
    query = select(Scholarship)
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


# ==========================================
# 3. ACTUALIZACIÓN DE ESTATUS (CON LÓGICA DE CUPOS)
# ==========================================

@router.patch("/applications/{application_id}", response_model=ApplicationRead)
def update_application_status(
        application_id: int,
        application_in: ApplicationUpdate,
        background_tasks: BackgroundTasks,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """
    Aprueba o Rechaza solicitudes.
    LÓGICA CRÍTICA:
    - Si apruebas: Verifica cupo disponible y resta 1.
    - Si rechazas (y estaba aprobada): Suma 1 al cupo (libera).
    """
    application = session.get(ScholarshipApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    # Permisos
    if current_user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        pass
    elif current_user.role == UserRole.CONCEJAL:
        if not current_user.career or application.career != current_user.career:
            raise HTTPException(status_code=403, detail="Solo puedes evaluar tu carrera")
    else:
        raise HTTPException(status_code=403, detail="No autorizado")

    old_status = application.status
    new_status = application_in.status

    # --- LÓGICA DE CUPOS (QUOTAS) ---
    if new_status and new_status != old_status:

        # Buscar el cupo correspondiente a la carrera y beca
        quota = session.exec(
            select(ScholarshipQuota)
            .where(ScholarshipQuota.scholarship_id == application.scholarship_id)
            .where(ScholarshipQuota.career_name == application.career)
        ).first()

        # CASO 1: INTENTAR APROBAR
        if new_status == ApplicationStatus.APROBADA:
            if not quota:
                # Si no existe cupo inicializado, asumimos 0 o bloqueamos.
                # Bloqueamos por seguridad. El admin debe inicializar cupos primero.
                raise HTTPException(status_code=400,
                                    detail="No se han definido cupos para esta carrera. Contacta al Coordinador.")

            if quota.used_slots >= quota.total_slots:
                raise HTTPException(
                    status_code=400,
                    detail=f"¡CUPO LLENO! ({quota.used_slots}/{quota.total_slots}). Solicita más cupos al Coordinador."
                )

            # Si pasa, incrementamos uso
            quota.used_slots += 1
            session.add(quota)

        # CASO 2: REVOCAR APROBACIÓN (Estaba aprobada y ahora se rechaza o pone pendiente)
        elif old_status == ApplicationStatus.APROBADA and new_status != ApplicationStatus.APROBADA:
            if quota and quota.used_slots > 0:
                quota.used_slots -= 1
                session.add(quota)

    # --- ACTUALIZAR DATOS ---
    update_data = application_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(application, key, value)

    session.add(application)
    session.commit()
    session.refresh(application)

    # --- NOTIFICACIONES EMAIL ---
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