from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func
from typing import List
from datetime import date, datetime, timedelta
import io
import openpyxl
from typing import Optional

from app.core.database import get_session
from app.models.attendance_model import Attendance, AttendanceStatus
from app.models.student_model import Student
from app.models.user_model import User, UserRole, UserArea
from app.schemas.attendance_schema import AttendanceCreate, AttendanceRead, WeeklyFaultsRead
from app.api.deps import get_current_user # 👈 USAMOS EL GENERAL

router = APIRouter()

# --- FUNCIÓN AUXILIAR DE PERMISOS ---
def is_becarios_manager(user: User) -> bool:
    if user.role in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        return True
    if user.area in [UserArea.BECAS, UserArea.PREVENCION, UserArea.PRESIDENCIA]:
        return True
    return False

@router.post("/", response_model=AttendanceRead)
def register_attendance(
        *,
        session: Session = Depends(get_session),
        attendance_in: AttendanceCreate,
        current_user: User = Depends(get_current_user) # 👈
):
    if not is_becarios_manager(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    student = session.get(Student, attendance_in.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Becario no encontrado")

    existing = session.exec(
        select(Attendance).where(
            Attendance.student_id == attendance_in.student_id,
            Attendance.date == attendance_in.date
        )
    ).first()

    if existing:
        existing.status = attendance_in.status
        existing.time_in = attendance_in.time_in
        existing.registered_by_id = current_user.id
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    new_attendance = Attendance(
        **attendance_in.model_dump(),
        registered_by_id=current_user.id
    )
    session.add(new_attendance)
    session.commit()
    session.refresh(new_attendance)
    return new_attendance


@router.get("/faltas-semana/{student_id}", response_model=WeeklyFaultsRead)
def get_weekly_faults(
        student_id: str,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user) # 👈
):
    if not is_becarios_manager(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    today = datetime.utcnow().date()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=4)

    faults = session.exec(
        select(func.count(Attendance.id)).where(
            Attendance.student_id == student_id,
            Attendance.date >= start_of_week,
            Attendance.date <= end_of_week,
            Attendance.status == AttendanceStatus.FALTA
        )
    ).one()

    return {"student_id": student_id, "fault_count": faults}


@router.get("/exportar", response_class=StreamingResponse)
def export_attendances_excel(
        start_date: date,
        end_date: date,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user) # 👈
):
    if not is_becarios_manager(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    students = session.exec(select(Student)).all()
    attendances = session.exec(
        select(Attendance).where(Attendance.date >= start_date, Attendance.date <= end_date)
    ).all()

    att_map = {}
    for att in attendances:
        if att.student_id not in att_map:
            att_map[att.student_id] = {}
        att_map[att.student_id][att.date] = att.status.value

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Asistencias General"

    headers = ["No. Control", "Nombre Completo", "Faltas Totales"]
    current_date = start_date
    date_list = []

    while current_date <= end_date:
        if current_date.weekday() < 5:
            date_list.append(current_date)
            headers.append(current_date.strftime("%d/%m/%Y"))
        current_date += timedelta(days=1)

    ws.append(headers)

    for student in students:
        row = [student.control_number, student.full_name]
        student_atts = att_map.get(student.control_number, {})

        faults = sum(1 for d in date_list if student_atts.get(d) == AttendanceStatus.FALTA.value)
        row.append(faults)

        for d in date_list:
            status = student_atts.get(d, "-")
            row.append(status)

        ws.append(row)

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    filename = f"Asistencias_{start_date}_al_{end_date}.xlsx"
    headers_response = {
        'Content-Disposition': f'attachment; filename="{filename}"',
        'Access-Control-Expose-Headers': 'Content-Disposition'
    }
    return StreamingResponse(
        stream,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers=headers_response
    )

@router.get("/semana/{student_id}", response_model=List[AttendanceRead])
def get_weekly_attendance(
    student_id: str,
    date_ref: Optional[date] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user) # 👈
):
    if not is_becarios_manager(current_user):
        raise HTTPException(status_code=403, detail="No autorizado")

    target_date = date_ref if date_ref else datetime.utcnow().date()
    start_of_week = target_date - timedelta(days=target_date.weekday())
    end_of_week = start_of_week + timedelta(days=4)

    return session.exec(
        select(Attendance).where(
            Attendance.student_id == student_id,
            Attendance.date >= start_of_week,
            Attendance.date <= end_of_week
        )
    ).all()