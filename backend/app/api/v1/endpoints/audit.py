import os
import subprocess
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.config import settings
from app.models.audit_model import AuditLog
from app.models.user_model import User, UserRole
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/")
def get_audit_logs(
        module: str = None,
        limit: int = 100,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(status_code=403, detail="No autorizado")
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    if module:
        query = query.where(AuditLog.module == module)
    return session.exec(query.limit(limit)).all()


@router.get("/dump")
def download_database_dump(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    # Suponiendo que settings.DATABASE_URL tiene el formato:
    # postgresql://usuario:password@host:puerto/dbname
    db_url = settings.DATABASE_URL

    # Creamos un nombre de archivo temporal
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    dump_filename = f"respaldo_ceitm_{timestamp}.sql"
    dump_path = f"/tmp/{dump_filename}"

    try:
        # Ejecutamos pg_dump.
        # El comando toma la URL completa, por lo que ya incluye credenciales.
        # --clean ayuda a que al restaurar, se borren tablas viejas primero.
        command = f"pg_dump {db_url} --clean > {dump_path}"

        result = subprocess.run(command, shell=True, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"Error de pg_dump: {result.stderr}")
            raise HTTPException(status_code=500, detail="Error al generar el respaldo en el motor SQL")

        return FileResponse(
            path=dump_path,
            filename=dump_filename,
            media_type="application/sql"
        )

    except Exception as e:
        print(f"Error crítico: {str(e)}")
        raise HTTPException(status_code=500, detail="Fallo interno al procesar el respaldo")