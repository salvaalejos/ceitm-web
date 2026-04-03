from pydantic import BaseModel
from typing import Optional
# CORRECCIÓN: Importamos date y time con un alias
from datetime import date as date_type, time as time_type
from app.models.attendance_model import AttendanceStatus

class AttendanceBase(BaseModel):
    student_id: str
    date: date_type
    time_in: Optional[time_type] = None
    status: AttendanceStatus = AttendanceStatus.PRESENTE
    nfc_uid_scanned: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceRead(AttendanceBase):
    id: int
    registered_by_id: Optional[int]

    class Config:
        from_attributes = True

class WeeklyFaultsRead(BaseModel):
    student_id: str
    fault_count: int