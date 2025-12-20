from sqlmodel import Session
from app.models.audit_model import AuditLog
from app.models.user_model import User

def log_action(
    session: Session,
    user: User,
    action: str,
    module: str,
    details: str,
    resource_id: str = None,
    ip: str = None
):
    """
    Registra una acción en la bitácora de auditoría.
    No hace commit por sí mismo para no romper la transacción principal,
    se debe hacer session.commit() después o dejar que el endpoint lo haga.
    """
    try:
        log = AuditLog(
            user_id=user.id,
            user_email=user.email,
            user_role=user.role,
            action=action.upper(),
            module=module.upper(),
            details=details,
            resource_id=str(resource_id) if resource_id else None,
            ip_address=ip
        )
        session.add(log)
        # Nota: No hacemos commit aquí para que sea parte de la misma transacción del endpoint
        # Si el endpoint falla, el log tampoco se guarda (lo cual suele ser correcto: no hubo acción).
    except Exception as e:
        print(f"Error al registrar auditoría: {e}")