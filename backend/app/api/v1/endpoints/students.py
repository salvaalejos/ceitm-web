from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, SQLModel
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.student_model import Student
from app.models.scholarship_model import ScholarshipApplication, ApplicationStatus
from app.api.deps import get_current_user

router = APIRouter()


# --- ESQUEMAS DE RESPUESTA LIGEROS ---
# Usamos SQLModel porque lee objetos de BD automáticamente (from_attributes=True por defecto)
class CareerRelRead(SQLModel):
    name: str


class StudentReadWithCareer(SQLModel):
    control_number: str
    full_name: str
    email: str
    career: Optional[str] = None
    is_blacklisted: bool
    career_rel: Optional[CareerRelRead] = None


class PaginatedStudents(SQLModel):
    total: int
    items: List[StudentReadWithCareer]


# --- ENDPOINTS ---
@router.get("/", response_model=PaginatedStudents)
def read_students(
        skip: int = Query(0, ge=0),
        limit: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(None),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    try:
        if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
            raise HTTPException(status_code=403, detail="No autorizado")

        # 1. Armamos la consulta base (Solo becarios con estatus válido)
        base_query = select(Student).join(ScholarshipApplication).where(
            ScholarshipApplication.status.in_([ApplicationStatus.APROBADA, ApplicationStatus.LIBERADA])
        ).distinct()

        # 2. Si el usuario escribió algo en el buscador, filtramos
        if search:
            base_query = base_query.where(
                (Student.full_name.icontains(search)) |
                (Student.control_number.icontains(search))
            )

        # 3. Contamos el total de registros de forma segura
        all_matching_students = session.exec(base_query).all()
        total = len(all_matching_students)

        # 4. Traemos solo la página actual con su carrera
        query = base_query.options(selectinload(Student.career_rel)).offset(skip).limit(limit)
        students = session.exec(query).all()

        return PaginatedStudents(total=total, items=students)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


@router.get("/{control_number}/history")
def get_student_history(
        control_number: str,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
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