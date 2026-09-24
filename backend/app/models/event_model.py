from typing import Optional
from enum import Enum
from datetime import date, time, datetime

from sqlmodel import SQLModel, Field
from sqlmodel.main import NaiveDatetime


class EventCategory(str, Enum):
    PONY_EMPRENDE = "Pony Emprende"
    OFICIAL_CEITM = "Oficial CEITM"
    OFICIAL_CARRERA = "Oficial Carrera"
    ANIVERSARIO = "Aniversario"


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    title: str
    description: Optional[str] = None
    event_date: date = Field(index=True)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None

    category: EventCategory = Field(default=EventCategory.OFICIAL_CEITM, index=True)

    created_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: NaiveDatetime = Field(default_factory=datetime.utcnow)