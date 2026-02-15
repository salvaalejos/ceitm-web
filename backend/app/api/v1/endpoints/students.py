from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.student_model import Student
from app.models.scholarship_model import ScholarshipApplication, ApplicationStatus
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/", response_model=List[Student])
def read_students(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """
    Obtiene SOLO los alumnos que son oficialmente BECARIOS
    (tienen al menos una solicitud APROBADA o LIBERADA).
    """
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Filtramos estudiantes que tengan al menos una application con status positivo
    query = select(Student).distinct().join(ScholarshipApplication).where(
        ScholarshipApplication.status.in_([ApplicationStatus.APROBADA, ApplicationStatus.LIBERADA])
    ).options(selectinload(Student.career_rel))  # Cargamos carrera para que no salga vacía

    return session.exec(query).all()


@router.get("/{control_number}/history")
def get_student_history(
        control_number: str,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Historial completo con datos para descargar y liberar.
    """
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    applications = session.exec(
        select(ScholarshipApplication)
        .where(ScholarshipApplication.control_number == control_number)
        .options(selectinload(ScholarshipApplication.scholarship))
        .order_by(ScholarshipApplication.created_at.desc())
    ).all()

    return applications


@router.patch("/{control_number}/toggle-blacklist")
def toggle_blacklist(
        control_number: str,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(status_code=403, detail="Solo Admin")

    student = session.get(Student, control_number)
    if not student: raise HTTPException(status_code=404, detail="No encontrado")

    student.is_blacklisted = not student.is_blacklisted
    session.add(student)
    session.commit()
    return student