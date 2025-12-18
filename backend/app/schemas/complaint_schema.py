from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime
from app.models.complaint_model import ComplaintType, ComplaintStatus

class ComplaintBase(SQLModel):
    full_name: str
    control_number: str
    phone_number: str
    career: str
    semester: str
    type: ComplaintType
    description: str
    evidence_url: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintRead(ComplaintBase):
    id: int
    status: ComplaintStatus
    created_at: datetime

class ComplaintUpdate(SQLModel):
    status: Optional[ComplaintStatus] = None