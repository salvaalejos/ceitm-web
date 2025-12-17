from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_password_hash
from app.models.user_model import User, UserRole
from app.schemas.user_schema import UserPublic, UserCreate, UserUpdate
from app.api.deps import get_current_user

router = APIRouter()


# --- RUTAS PÚBLICAS ---

@router.get("/concejales", response_model=List[UserPublic])
def read_concejales(session: Session = Depends(get_session)):
    """
    Obtiene la lista pública del equipo (solo activos, sin datos sensibles).
    """
    users = session.exec(select(User).where(User.is_active == True)).all()
    return users


# --- RUTAS PRIVADAS (SOLO ADMIN/ESTRUCTURA) ---

@router.get("/", response_model=List[UserPublic])
def read_users(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Listar todos los usuarios (Para el panel de administración).
    """
    # Solo Admin o Mesa Directiva pueden ver la lista completa
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver usuarios")

    # Ordenar por ID
    users = session.exec(select(User).order_by(User.id)).all()
    return users


@router.post("/", response_model=UserPublic)
def create_user(
        user_in: UserCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Crear nuevo usuario (Solo Admin).
    """
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(status_code=403, detail="Solo el Administrador del Sistema puede crear usuarios")

    # Verificar email duplicado
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya existe")

    # Hashear contraseña y guardar
    user = User.model_validate(
        user_in,
        update={"hashed_password": get_password_hash(user_in.password)}
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserPublic)
def update_user(
        user_id: int,
        user_in: UserUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar")

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # exclude_unset=True significa: "Solo actualiza lo que el frontend envió"
    user_data = user_in.model_dump(exclude_unset=True)

    if "password" in user_data and user_data["password"]:
        user_data["hashed_password"] = get_password_hash(user_data["password"])
        del user_data["password"]

    for key, value in user_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.delete("/{user_id}")
def delete_user(
        user_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Eliminar usuario (lógico o físico).
    """
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar")

    # Evitar auto-eliminación
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    session.delete(user)
    session.commit()
    return {"ok": True}