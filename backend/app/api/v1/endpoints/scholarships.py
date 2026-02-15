from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from datetime import datetime
import io

from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.scholarship_model import Scholarship, ScholarshipApplication, ApplicationStatus, ScholarshipQuota, \
    ScholarshipPeriod
from app.models.student_model import Student
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
# 0. UTILIDADES INTERNAS
# ==========================================

def generate_release_folio(application: ScholarshipApplication, scholarship: Scholarship) -> str:
    """
    Genera el folio único usando la configuración manual del Coordinador.
    Formato: [ID_ACTIVIDAD]-[NO.CONTROL]-[TIPO]-[PERIODO]
    Ejemplo: REC-23120538-ALI-25B
    """
    # 1. ACTIVIDAD (3 letras del identificador configurado)
    # Ej: "Recolecta" -> "REC", "Donación" -> "DON"
    activity_code = scholarship.folio_identifier[:3].upper() if scholarship.folio_identifier else "GEN"

    # 2. NO. CONTROL
    control = application.control_number.strip().upper()

    # 3. TIPO (3 letras)
    type_map = {
        "Alimenticia": "ALI",
        "Reinscripción": "REI",
        "CLE (Idiomas)": "CLE",
        "Otra": "GEN"
    }
    sch_type = scholarship.type.value if hasattr(scholarship.type, 'value') else str(scholarship.type)
    type_code = type_map.get(sch_type, "OTR")

    # 4. PERIODO (Año 2 dígitos + Letra)
    # Usamos el año configurado (ej. 2025 -> 25)
    year_short = str(scholarship.year)[-2:]

    # Mapeo del Enum de Periodo a Letra
    period_letter = "A"  # Default Enero-Junio
    if scholarship.period == ScholarshipPeriod.AGO_DIC:
        period_letter = "B"
    elif scholarship.period == ScholarshipPeriod.VERANO:
        period_letter = "V"

    return f"{activity_code}{control}{type_code}{year_short}{period_letter}"


def sync_student_record(session: Session, application_in: ApplicationCreate) -> Student:
    """
    Sincroniza o crea el expediente del alumno (Student).
    """
    student = session.get(Student, application_in.control_number)

    # Resolver ID de Carrera
    career_obj = session.exec(select(Career).where(Career.name == application_in.career)).first()
    career_id = career_obj.id if career_obj else None

    if student:
        # Actualizar datos de contacto
        student.full_name = application_in.full_name
        student.email = application_in.email
        student.phone_number = application_in.phone_number
        if career_id:
            student.career_id = career_id
        session.add(student)
    else:
        # Crear nuevo
        student = Student(
            control_number=application_in.control_number,
            full_name=application_in.full_name,
            email=application_in.email,
            phone_number=application_in.phone_number,
            career=application_in.career,
            career_id=career_id
        )
        session.add(student)

    session.commit()
    session.refresh(student)
    return student


# ==========================================
# 1. GESTIÓN DE CUPOS
# ==========================================

@router.post("/{scholarship_id}/quotas/init", response_model=List[ScholarshipQuotaRead])
def initialize_quotas(
        scholarship_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
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
# 2. ENDPOINTS DE SOLICITUD
# ==========================================

@router.post("/apply", response_model=ApplicationRead)
@limiter.limit("5/minute")
def submit_application(
        request: Request,
        application_in: ApplicationCreate,
        background_tasks: BackgroundTasks,
        session: Session = Depends(get_session)
):
    scholarship = session.get(Scholarship, application_in.scholarship_id)
    if not scholarship or not scholarship.is_active:
        raise HTTPException(status_code=400, detail="La convocatoria no está activa")

    now = datetime.utcnow()
    if now < scholarship.start_date or now > scholarship.end_date:
        raise HTTPException(status_code=400, detail="Fuera del periodo de registro")

    # Sincronización con Expediente (Student)
    student = sync_student_record(session, application_in)

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
            existing.student_id = student.control_number

            session.add(existing)
            session.commit()
            session.refresh(existing)
            application = existing
        else:
            raise HTTPException(status_code=400, detail="Ya tienes una solicitud activa.")
    else:
        application = ScholarshipApplication.model_validate(application_in)
        application.student_id = student.control_number

        session.add(application)
        session.commit()
        session.refresh(application)

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
        print(f"⚠️ Error enviando correo: {e}")

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
    query = select(ScholarshipApplication).where(ScholarshipApplication.scholarship_id == scholarship_id).options(
        selectinload(ScholarshipApplication.student))

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
# 3. ACTUALIZACIÓN Y GENERACIÓN DE FOLIOS
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
        scholarship = session.get(Scholarship, application.scholarship_id)

        # Gestión de Cupos
        quota = session.exec(
            select(ScholarshipQuota)
            .where(ScholarshipQuota.scholarship_id == application.scholarship_id)
            .where(ScholarshipQuota.career_name == application.career)
        ).first()

        if new_status == ApplicationStatus.APROBADA:
            if not quota:
                raise HTTPException(status_code=400, detail="Cupos no definidos.")
            if quota.used_slots >= quota.total_slots:
                raise HTTPException(status_code=400, detail="¡CUPO LLENO!")
            quota.used_slots += 1
            session.add(quota)

        elif old_status == ApplicationStatus.APROBADA and new_status != ApplicationStatus.APROBADA:
            if quota and quota.used_slots > 0:
                quota.used_slots -= 1
                session.add(quota)

        # --- GENERAR FOLIO AUTOMÁTICO AL LIBERAR ---
        if new_status == ApplicationStatus.LIBERADA and not application.release_folio:
            application.release_folio = generate_release_folio(application, scholarship)

    update_data = application_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(application, key, value)

    session.add(application)
    session.commit()
    session.refresh(application)

    # Notificaciones
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


@router.get("/applications/{application_id}/download")
async def download_application_pdf(
        application_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA, UserRole.CONCEJAL]:
        raise HTTPException(status_code=403, detail="No autorizado")

    application = session.get(ScholarshipApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if current_user.role == UserRole.CONCEJAL:
        if application.career != current_user.career:
            raise HTTPException(status_code=403, detail="Solo tu carrera")

    try:
        pdf_bytes = await generate_scholarship_pdf(application)
    except Exception as e:
        print(f"Error generando PDF: {e}")
        raise HTTPException(status_code=500, detail="Error al generar el documento PDF.")

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