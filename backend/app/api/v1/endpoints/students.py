from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, SQLModel, func # 👈 AGREGADO func
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta # 👈 AGREGADO timedelta

from app.core.database import get_session
from app.models.user_model import User, UserRole, UserArea
from app.models.student_model import Student
from app.models.scholarship_model import ScholarshipApplication, ApplicationStatus
from app.models.attendance_model import Attendance, AttendanceStatus # 👈 AGREGADO para poder consultar las faltas
from app.api.deps import get_current_user

router = APIRouter()

# --- FUNCIÓN AUXILIAR DE PERMISOS ---
def is_becarios_manager(user: User) -> bool:
    """
    Permite el acceso al padrón de becarios a:
    Admin, Mesa Directiva, Presidencia, Área de Becas y Prevención y Logística.
    """
    if user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        return True
    if user.area in [UserArea.BECAS, UserArea.PREVENCION, UserArea.PRESIDENCIA]:
        return True
    return False

# --- ESQUEMAS DE RESPUESTA LIGEROS ---
class CareerRelRead(SQLModel):
    name: str

class StudentReadWithCareer(SQLModel):
    control_number: str
    full_name: str
    email: str
    career: Optional[str] = None
    is_blacklisted: bool
    career_rel: Optional[CareerRelRead] = None
    scholarship_type: Optional[str] = None
    days_active: Optional[int] = None
    total_services: Optional[int] = 0
    released_services: Optional[int] = 0
    current_week_faults: Optional[int] = 0 # 👈 NUEVO: Campo para que el frontend lo lea

class PaginatedStudents(SQLModel):
    total: int
    items: List[StudentReadWithCareer]

# --- ENDPOINTS ---
@router.get("/", response_model=PaginatedStudents)
def read_students(
        skip: int = Query(0, ge=0),
        limit: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(None),
        sort_by: Optional[str] = Query("control_desc"),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    try:
        # 👇 1. Validación de Permisos Segura
        if not is_becarios_manager(current_user):
            raise HTTPException(status_code=403, detail="No tienes autorización para ver el padrón de becarios.")

        # 👇 NUEVO: Fechas para calcular la semana actual
        today = datetime.utcnow().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=4)

        # 👇 2. Consulta Base
        base_query = select(Student).join(ScholarshipApplication).where(
            ScholarshipApplication.status.in_([ApplicationStatus.APROBADA, ApplicationStatus.LIBERADA])
        ).distinct()

        # 👇 3. Búsqueda
        if search:
            base_query = base_query.where(
                (Student.full_name.icontains(search)) |
                (Student.control_number.icontains(search))
            )

        # 👇 4. Ordenamiento Dinámico
        if sort_by == "name_asc":
            base_query = base_query.order_by(Student.full_name.asc())
        elif sort_by == "name_desc":
            base_query = base_query.order_by(Student.full_name.desc())
        elif sort_by == "control_asc":
            base_query = base_query.order_by(Student.control_number.asc())
        else:
            base_query = base_query.order_by(Student.control_number.desc())

        all_matching_students = session.exec(base_query).all()
        total = len(all_matching_students)

        query = base_query.options(
            selectinload(Student.career_rel),
            selectinload(Student.applications).selectinload(ScholarshipApplication.scholarship)
        ).offset(skip).limit(limit)

        students_db = session.exec(query).all()

        items = []
        now = datetime.utcnow()

        for student in students_db:
            active_app = None
            total_serv = 0
            released_serv = 0

            for app in student.applications:
                if app.status in [ApplicationStatus.APROBADA, ApplicationStatus.LIBERADA]:
                    total_serv += 1
                    if app.status == ApplicationStatus.LIBERADA:
                        released_serv += 1

                    if not active_app or (
                            app.created_at and active_app.created_at and app.created_at > active_app.created_at):
                        active_app = app

            s_type = None
            d_active = None

            if active_app and active_app.scholarship:
                # Extracción súper segura del ENUM (Evita crash 500)
                try:
                    s_type = active_app.scholarship.type.value
                except AttributeError:
                    s_type = str(active_app.scholarship.type)

                if active_app.scholarship.results_date:
                    try:
                        delta = now.replace(tzinfo=None) - active_app.scholarship.results_date.replace(tzinfo=None)
                        d_active = max(0, delta.days)
                    except Exception:
                        pass

            career_name = student.career_rel.name if student.career_rel else None

            # 👇 NUEVO: Calculamos cuántas faltas tiene este becario esta semana
            faults = session.exec(
                select(func.count(Attendance.id)).where(
                    Attendance.student_id == student.control_number,
                    Attendance.date >= start_of_week,
                    Attendance.date <= end_of_week,
                    Attendance.status == AttendanceStatus.FALTA
                )
            ).one()

            student_data = StudentReadWithCareer(
                control_number=student.control_number,
                full_name=student.full_name,
                email=student.email,
                career=career_name,
                is_blacklisted=student.is_blacklisted,
                career_rel=CareerRelRead(name=career_name) if career_name else None,
                scholarship_type=s_type,
                days_active=d_active,
                total_services=total_serv,
                released_services=released_serv,
                current_week_faults=faults # 👈 AQUÍ SE LO MANDAMOS AL FRONTEND
            )

            items.append(student_data)

        return PaginatedStudents(total=total, items=items)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("--- ERROR FATAL EN READ_STUDENTS ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


@router.get("/{control_number}/history")
def get_student_history(
        control_number: str,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if not is_becarios_manager(current_user):
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
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA] and current_user.area != UserArea.PREVENCION:
        raise HTTPException(status_code=403, detail="No autorizado para vetar alumnos")

    student = session.get(Student, control_number)
    if not student: raise HTTPException(status_code=404, detail="No encontrado")

    student.is_blacklisted = not student.is_blacklisted
    session.add(student)
    session.commit()
    return student