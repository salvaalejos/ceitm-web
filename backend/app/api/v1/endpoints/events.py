from typing import List, Optional
from datetime import date, time, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import extract, or_
from sqlmodel import Session, SQLModel, select

from app.core.database import get_session
from app.models.user_model import User, UserRole
from app.models.event_model import Event, EventCategory
from app.models.audit_model import AuditLog
from app.api.deps import get_current_active_user

router = APIRouter()


# -----------------------------------------------------------------------------
# PERMISOS: Lo puede manejar cualquier miembro del Concejo (usuario logueado)
# -----------------------------------------------------------------------------
def is_events_manager(user: User) -> bool:
    return user.role in [
        UserRole.ADMIN_SYS,
        UserRole.ESTRUCTURA,
        UserRole.CONCEJAL,
        UserRole.COORDINADOR,
        UserRole.VOCAL,
    ]


def _check_manager(user: User):
    if not is_events_manager(user):
        raise HTTPException(status_code=403, detail="No tienes autorización para gestionar eventos.")


def _log_audit(session: Session, user: User, action: str, event_id: int, details: str):
    log = AuditLog(
        user_id=user.id,
        user_email=user.email,
        user_role=user.role.value,
        action=action,
        module="CALENDARIO",
        resource_id=str(event_id),
        details=details,
    )
    session.add(log)
    session.commit()


# --- ESQUEMAS DE RESPUESTA ---
class EventRead(SQLModel):
    id: int
    title: str
    description: Optional[str] = None
    event_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    category: str
    created_at: datetime


class EventCreate(SQLModel):
    title: str
    description: Optional[str] = None
    event_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    category: EventCategory = EventCategory.OFICIAL_CEITM


class EventUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    category: Optional[EventCategory] = None


def _to_read(event: Event) -> EventRead:
    return EventRead(
        id=event.id,
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        category=event.category.value if hasattr(event.category, "value") else str(event.category),
        created_at=event.created_at,
    )


# -----------------------------------------------------------------------------
# GET / - Listar eventos (interno, cualquier miembro del Concejo)
# -----------------------------------------------------------------------------
@router.get("/", response_model=List[EventRead])
def read_events(
        month: Optional[int] = Query(None, ge=1, le=12),
        year: Optional[int] = Query(None),
        search: Optional[str] = Query(None),
        category: Optional[str] = Query(None),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    _check_manager(current_user)

    query = select(Event)

    if month and year:
        query = query.where(
            extract("month", Event.event_date) == month,
            extract("year", Event.event_date) == year,
        )
    elif year:
        query = query.where(extract("year", Event.event_date) == year)

    if category:
        query = query.where(Event.category == category)

    if search:
        term = f"%{search.lower()}%"
        query = query.where(
            or_(
                Event.title.ilike(term),
                Event.description.ilike(term),
            )
        )

    query = query.order_by(Event.event_date.asc(), Event.start_time.asc(), Event.id.asc())
    events = session.exec(query).all()
    return [_to_read(e) for e in events]


# -----------------------------------------------------------------------------
# POST / - Crear evento
# -----------------------------------------------------------------------------
@router.post("/", response_model=EventRead)
def create_event(
        event_in: EventCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    _check_manager(current_user)

    if not event_in.title.strip():
        raise HTTPException(status_code=400, detail="El título del evento es obligatorio.")

    event = Event(
        title=event_in.title.strip(),
        description=event_in.description,
        event_date=event_in.event_date,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        location=event_in.location,
        category=event_in.category,
        created_by_id=current_user.id,
    )
    session.add(event)
    session.commit()
    session.refresh(event)

    _log_audit(session, current_user, "CREATE", event.id, f"Creó el evento '{event.title}'")

    return _to_read(event)


# -----------------------------------------------------------------------------
# PUT /{event_id} - Actualizar evento
# -----------------------------------------------------------------------------
@router.put("/{event_id}", response_model=EventRead)
def update_event(
        event_id: int,
        event_in: EventUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    _check_manager(current_user)

    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    update_data = event_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)

    session.add(event)
    session.commit()
    session.refresh(event)

    _log_audit(session, current_user, "UPDATE", event.id, f"Actualizó el evento '{event.title}'")

    return _to_read(event)


# -----------------------------------------------------------------------------
# DELETE /{event_id} - Eliminar evento
# -----------------------------------------------------------------------------
@router.delete("/{event_id}")
def delete_event(
        event_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    _check_manager(current_user)

    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    title = event.title
    session.delete(event)
    session.commit()

    _log_audit(session, current_user, "DELETE", event_id, f"Eliminó el evento '{title}'")

    return {"ok": True, "message": "Evento eliminado correctamente"}