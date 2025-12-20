from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.audit_model import AuditLog
from app.schemas.audit_schema import AuditLogRead
from app.models.user_model import User, UserRole
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[AuditLogRead])
def read_audit_logs(
    skip: int = 0,
    limit: int = 50,
    module: Optional[str] = None, # Filtro opcional por módulo (ej: USUARIOS, BECAS)
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener historial de auditoría.
    Solo para Administradores y Estructura.
    """
    # 1. Validación de seguridad estricta
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver la auditoría")

    # 2. Construir consulta
    query = select(AuditLog).order_by(AuditLog.created_at.desc())

    # 3. Aplicar filtros si existen
    if module:
        query = query.where(AuditLog.module == module.upper())

    # 4. Paginación
    query = query.offset(skip).limit(limit)

    logs = session.exec(query).all()
    return logs