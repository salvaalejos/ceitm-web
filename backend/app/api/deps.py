from typing import Annotated, Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session

from app.core.database import get_session
from app.core.config import settings
from app.models.user_model import User, UserRole

# Configuración de OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/access-token")

# --- 1. Dependencia de Base de Datos ---
# Creamos un alias para que 'get_db' funcione igual que 'get_session'
get_db = get_session

# --- 2. Obtener Usuario Actual (Validar Token) ---
async def get_current_user(
        token: Annotated[str, Depends(oauth2_scheme)],
        session: Annotated[Session, Depends(get_db)]
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodificar el token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Buscar usuario en BD
    user = session.get(User, int(user_id))
    if user is None:
        raise credentials_exception

    return user

# --- 3. Obtener Usuario Activo ---
def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user

# --- 4. Obtener Superusuario (Admin) ---
def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(
            status_code=403, detail="El usuario no tiene suficientes privilegios"
        )
    return current_user