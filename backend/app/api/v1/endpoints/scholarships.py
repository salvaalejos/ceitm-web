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
# 0. UTILIDADES (LÓGICA DE FOLIO MEJORADA)
# ==========================================

def generate_release_folio(
        application: ScholarshipApplication,
        scholarship: Scholarship,
        custom_activity: str = None,
        custom_year: int = None,
        custom_period: str = None
) -> str:
    """
    Genera el folio. Prioriza los datos manuales del Coordinador.
    Formato: [XXX]-[CONTROL]-[TIPO]-[YY][PERIODO]
    Ejemplo: REC-21120538-ALI-26A
    """
    # 1. Código de Actividad (Manual o Automático)
    if custom_activity:
        # Tomamos las primeras 3 letras de lo que escribió el coordinador
        activity_code = custom_activity[:3].upper()
    else:
        activity_code = scholarship.folio_identifier[:3].upper() if scholarship.folio_identifier else "GEN"

    control = application.control_number.strip().upper()

    # 2. Tipo de Beca (Fijo según la convocatoria)
    type_code = "GEN"
    sch_type_str = str(scholarship.type.value) if hasattr(scholarship.type, 'value') else str(scholarship.type)

    if "Alimenticia" in sch_type_str:
        type_code = "ALI"
    elif "Reinscripción" in sch_type_str:
        type_code = "REI"
    elif "Idiomas" in sch_type_str:
        type_code = "CLE"

    # 3. Año (Manual o de la Beca)
    year_val = custom_year if custom_year else scholarship.year
    year_short = str(year_val)[-2:]

    # 4. Periodo (Manual o de la Beca)
    if custom_period:
        period_letter = custom_period.upper()
    else:
        period_letter = "A"
        if scholarship.period == ScholarshipPeriod.AGO_DIC:
            period_letter = "B"
        elif scholarship.period == ScholarshipPeriod.VERANO:
            period_letter = "V"

    return f"{activity_code}{control}{type_code}{year_short}{period_letter}"


def sync_student_record(session: Session, application_in: ApplicationCreate) -> Student:
    """
    Sincroniza o crea el expediente del alumno.
    FIX: Eliminada la asignación de string a la relación 'career' para evitar Error 500.
    """
    student = session.get(Student, application_in.control_number)

    # Buscamos el ID de la carrera
    career_obj = session.exec(select(Career).where(Career.name == application_in.career)).first()
    career_id = career_obj.id if career_obj else None

    if student:
        student.full_name = application_in.full_name
        student.email = application_in.email
        student.phone_number = application_in.phone_number
        if career_id:
            student.career_id = career_id
        session.add(student)
    else:
        student = Student(
            control_number=application_in.control_number,
            full_name=application_in.full_name,
            email=application_in.email,
            phone_number=application_in.phone_number,
            # career=application_in.career, <--- ESTA LÍNEA SE ELIMINÓ PORQUE CAUSABA EL ERROR DE CORS/500
            career_id=career_id,
            is_blacklisted=False
        )
        session.add(student)

    # Nota: No hacemos commit aquí, se hace en el endpoint principal para atomicidad
    return student


# ==========================================
# 1. GESTIÓN DE ALUMNOS (ENDPOINT FALTANTE)
# ==========================================

@router.get("/students", response_model=List[Student])
def read_students(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """Devuelve la lista de expedientes (Soluciona error 405)."""
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Cargamos la relación de carrera para mostrarla en la tabla
    return session.exec(select(Student).options(selectinload(Student.career))).all()


# ==========================================
# 2. GESTIÓN DE CUPOS
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
# 3. ENDPOINTS DE SOLICITUD (FIX 500/CORS)
# ==========================================

@router.post("/apply", response_model=ApplicationRead)
@limiter.limit("5/minute")
def submit_application(
        request: Request,
        application_in: ApplicationCreate,
        background_tasks: BackgroundTasks,
        session: Session = Depends(get_session)
):
    # 1. Validar Beca
    scholarship = session.get(Scholarship, application_in.scholarship_id)
    if not scholarship or not scholarship.is_active:
        raise HTTPException(status_code=400, detail="La convocatoria no está activa")

    # 2. Sincronizar Estudiante (Sin guardar todavía)
    student = sync_student_record(session, application_in)

    # 3. Verificar duplicados
    existing = session.exec(
        select(ScholarshipApplication)
        .where(ScholarshipApplication.control_number == application_in.control_number)
        .where(ScholarshipApplication.scholarship_id == application_in.scholarship_id)
    ).first()

    if existing:
        if existing.status in [ApplicationStatus.DOCUMENTACION_FALTANTE, ApplicationStatus.RECHAZADA]:
            # Permitir reintento
            existing.sqlmodel_update(application_in.model_dump(exclude_unset=True))
            existing.status = ApplicationStatus.PENDIENTE
            existing.admin_comments = None
            session.add(existing)
            session.commit()
            session.refresh(existing)
            application = existing
        else:
            raise HTTPException(status_code=400, detail="Ya tienes una solicitud activa para esta beca.")
    else:
        # Nueva solicitud
        application = ScholarshipApplication.model_validate(application_in)
        # Aseguramos la relación con el estudiante
        application.student_id = student.control_number
        session.add(application)
        session.commit()
        session.refresh(application)

    # 4. Enviar Correo
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
                "date": datetime.utcnow().strftime("%d/%m/%Y"),
                "portal_url": frontend_link
            }
        )
    except Exception as e:
        print(f"⚠️ Error enviando correo: {e}")

    return application


@router.get("/", response_model=List[ScholarshipRead])
def read_scholarships(active_only: bool = True, session: Session = Depends(get_session)):
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
        raise HTTPException(status_code=403, detail="No autorizado")
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
    query = select(ScholarshipApplication) \
        .where(ScholarshipApplication.scholarship_id == scholarship_id) \
        .options(selectinload(ScholarshipApplication.student))  # Carga eager del estudiante

    if current_user.role == UserRole.CONCEJAL:
        if not current_user.career: return []
        query = query.where(ScholarshipApplication.career == current_user.career)
    elif current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    return session.exec(query).all()


@router.patch("/{scholarship_id}", response_model=ScholarshipRead)
def update_scholarship(
        scholarship_id: int,
        scholarship_in: ScholarshipUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    scholarship = session.get(Scholarship, scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=404, detail="No encontrada")

    for k, v in scholarship_in.model_dump(exclude_unset=True).items():
        setattr(scholarship, k, v)

    session.add(scholarship)
    session.commit()
    session.refresh(scholarship)
    return scholarship


# ==========================================
# 4. DICTAMEN Y LIBERACIÓN (CON DATOS MANUALES)
# ==========================================

@router.patch("/applications/{application_id}", response_model=ApplicationRead)
def update_application_status(
        application_id: int,
        application_in: ApplicationUpdate,
        background_tasks: BackgroundTasks,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    # Carga eager para asegurar que scholarship esté disponible
    application = session.exec(
        select(ScholarshipApplication)
        .where(ScholarshipApplication.id == application_id)
        .options(selectinload(ScholarshipApplication.scholarship))
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        # Concejales solo pueden ver, no liberar ni aprobar oficialmente (según reglas estrictas)
        # O ajusta según tu regla de negocio
        if current_user.role == UserRole.CONCEJAL:
            pass  # O validación específica
        else:
            raise HTTPException(status_code=403, detail="No autorizado")

    old_status = application.status
    new_status = application_in.status

    # Lógica de cambio de estado
    if new_status and new_status != old_status:
        scholarship = application.scholarship or session.get(Scholarship, application.scholarship_id)

        # Gestión de Cupos (Solo al Aprobar)
        if new_status == ApplicationStatus.APROBADA:
            quota = session.exec(
                select(ScholarshipQuota)
                .where(ScholarshipQuota.scholarship_id == application.scholarship_id)
                .where(ScholarshipQuota.career_name == application.career)
            ).first()

            if quota:
                if quota.used_slots >= quota.total_slots and current_user.role != UserRole.ADMIN_SYS:
                    raise HTTPException(status_code=400, detail="¡Cupo Lleno!")
                quota.used_slots += 1
                session.add(quota)

        elif old_status == ApplicationStatus.APROBADA and new_status != ApplicationStatus.APROBADA:
            # Liberar cupo si se arrepienten
            quota = session.exec(
                select(ScholarshipQuota)
                .where(ScholarshipQuota.scholarship_id == application.scholarship_id)
                .where(ScholarshipQuota.career_name == application.career)
            ).first()
            if quota and quota.used_slots > 0:
                quota.used_slots -= 1
                session.add(quota)

        # --- GENERACIÓN DE FOLIO (USANDO DATOS MANUALES DEL COORDINADOR) ---
        if new_status == ApplicationStatus.LIBERADA:
            # Siempre generamos/regeneramos si vienen datos manuales, o si no tiene folio
            application.release_folio = generate_release_folio(
                application,
                scholarship,
                custom_activity=application_in.release_activity,
                custom_year=application_in.release_year,
                custom_period=application_in.release_period
            )

    # Actualizar datos generales (excluyendo los campos temporales para no romper el modelo)
    exclude_fields = {"release_activity", "release_year", "release_period"}
    update_data = application_in.model_dump(exclude_unset=True, exclude=exclude_fields)

    for key, value in update_data.items():
        setattr(application, key, value)

    session.add(application)
    session.commit()
    session.refresh(application)

    # Correos
    if new_status != old_status:
        scholarship_name = application.scholarship.name if application.scholarship else "Beca"
        link = f"{get_frontend_url()}/becas/resultados"

        if new_status == ApplicationStatus.APROBADA:
            send_email_background(background_tasks, f"✅ Aprobada: {scholarship_name}", application.email,
                                  "accepted.html",
                                  {"name": application.full_name, "scholarship_name": scholarship_name, "link": link})
        elif new_status in [ApplicationStatus.RECHAZADA, ApplicationStatus.DOCUMENTACION_FALTANTE]:
            send_email_background(background_tasks, f"⚠️ Aviso: {scholarship_name}", application.email, "rejected.html",
                                  {"name": application.full_name, "scholarship_name": scholarship_name,
                                   "observations": application.admin_comments, "link": link})

    return application


@router.get("/applications/{application_id}/download")
async def download_application_pdf(
        application_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    application = session.get(ScholarshipApplication, application_id)
    if not application: raise HTTPException(status_code=404, detail="No encontrada")

    try:
        pdf_bytes = await generate_scholarship_pdf(application)
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={
            "Content-Disposition": f"attachment; filename={application.control_number}.pdf"})
    except:
        raise HTTPException(status_code=500, detail="Error generando PDF")


@router.get("/status/{control_number}", response_model=List[ApplicationPublicStatus])
@limiter.limit("5/minute")
def check_application_status(request: Request, control_number: str, session: Session = Depends(get_session)):
    return session.exec(
        select(ScholarshipApplication).where(ScholarshipApplication.control_number == control_number).order_by(
            ScholarshipApplication.created_at.desc())).all()