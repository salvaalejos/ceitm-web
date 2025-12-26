from typing import Annotated
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request # <--- AGREGADO: Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import create_access_token, verify_password
from app.core.config import settings
from app.models.user_model import User
from app.models.token import Token
from app.core.audit_logger import log_action
from app.core.limiter import limiter

router = APIRouter()


@router.post("/login/access-token", response_model=Token)
@limiter.limit("5/minute") # 🛡️ PROTECCIÓN: Máx 5 intentos por minuto por IP
def login_access_token(
        request: Request, # <--- OBLIGATORIO: SlowAPI necesita el objeto Request para leer la IP
        session: Annotated[Session, Depends(get_session)],
        form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # 1. Buscar usuario por email (username en el formulario cuenta como email)
    user = session.exec(select(User).where(User.email == form_data.username)).first()

    # 2. Validar usuario y contraseña
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Nota: Podríamos loguear intentos fallidos aquí, pero requiere cuidado para no llenar la BD
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Verificar si está activo
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")

    # 4. Crear el token de acceso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )

    # 👇 LOG: REGISTRO DE INICIO DE SESIÓN
    # Usamos el objeto 'user' que ya recuperamos de la base de datos
    log_action(
        session=session,
        user=user,
        action="LOGIN",
        module="AUTH",
        details="Inicio de sesión exitoso",
        resource_id=None
    )
    session.commit()

    return Token(access_token=access_token, token_type="bearer")