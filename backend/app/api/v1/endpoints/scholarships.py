from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime

from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.scholarship_model import Scholarship, ScholarshipApplication
from app.schemas.scholarship_schema import (
    ScholarshipCreate, ScholarshipRead, ScholarshipUpdate,
    ApplicationCreate, ApplicationRead, ApplicationUpdate, ApplicationPublicStatus
)
# Solo usamos auth para el Admin, no para los alumnos
from app.api.deps import get_current_user

router = APIRouter()


# --- PÚBLICO: ENVIAR SOLICITUD (SIN LOGIN) ---
@router.post("/apply", response_model=ApplicationRead)
def submit_application(
        application_in: ApplicationCreate,
        session: Session = Depends(get_session)
        # ❌ QUITAMOS: current_user: User = Depends(get_current_user)
):
    """
    Enviar solicitud de beca (Acceso Público).
    Se valida que el No. Control no haya aplicado ya a esta beca.
    """
    # 1. Verificar si la beca existe y está activa
    scholarship = session.get(Scholarship, application_in.scholarship_id)
    if not scholarship or not scholarship.is_active:
        raise HTTPException(status_code=400, detail="La convocatoria no está activa")

    # 2. Verificar fechas
    now = datetime.utcnow()
    if now < scholarship.start_date or now > scholarship.end_date:
        raise HTTPException(status_code=400, detail="Fuera del periodo de registro")

    # 3. VALIDACIÓN POR NO. CONTROL (Evitar doble solicitud)
    existing = session.exec(
        select(ScholarshipApplication)
        .where(ScholarshipApplication.control_number == application_in.control_number)
        .where(ScholarshipApplication.scholarship_id == application_in.scholarship_id)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Este Número de Control ya registró una solicitud para esta beca.")

    # 4. Crear solicitud
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


# --- PRIVADO: REVISIÓN DE SOLICITUDES (CONCEJALES/ADMIN) ---
@router.get("/applications", response_model=List[ApplicationRead])
def read_all_applications(
        scholarship_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Ver solicitudes (Admin ve todas, Concejal solo su carrera).
    """
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

@router.patch("/applications/{application_id}", response_model=ApplicationRead)
def update_application_status(
    application_id: int,
    application_in: ApplicationUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    application = session.get(ScholarshipApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    # Lógica de permisos Concejal vs Admin
    if current_user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        pass
    elif current_user.role == UserRole.CONCEJAL:
        if not current_user.career or application.career != current_user.career:
            raise HTTPException(status_code=403, detail="Solo puedes evaluar tu carrera")
    else:
        raise HTTPException(status_code=403, detail="No autorizado")

    update_data = application_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(application, key, value)

    session.add(application)
    session.commit()
    session.refresh(application)
    return application


# --- PÚBLICO: CONSULTAR ESTATUS ---
@router.get("/status/{control_number}", response_model=List[ApplicationPublicStatus])
def check_application_status(
        control_number: str,
        session: Session = Depends(get_session)
):
    """
    Permite a un alumno consultar el estado de sus solicitudes usando solo su No. Control.
    Retorna solo datos no sensibles (Estatus, Comentarios).
    """
    # Buscamos todas las solicitudes de este número de control
    applications = session.exec(
        select(ScholarshipApplication)
        .where(ScholarshipApplication.control_number == control_number)
        .order_by(ScholarshipApplication.created_at.desc())
    ).all()

    return applications