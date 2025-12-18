from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_password_hash
from app.models.user_model import User, UserRole
# Asegúrate de importar UserUpdateMe
from app.schemas.user_schema import UserPublic, UserCreate, UserUpdate, UserUpdateMe
from app.api.deps import get_current_user

router = APIRouter()


# ==========================================
# 1. RUTAS DE "MI PERFIL" (PRIORIDAD ALTA)
# ==========================================
# Estas deben ir PRIMERO para que 'me' no se confunda con un {user_id}

@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Obtener mis datos.
    """
    return current_user


@router.put("/me", response_model=UserPublic)
def update_user_me(
        user_in: UserUpdateMe,
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    """
    Actualizar mi propio perfil (Autoservicio).
    """
    # exclude_unset=True es vital para no borrar datos que no enviaste
    user_data = user_in.model_dump(exclude_unset=True)

    # Si viene password, hay que hashearla
    if "password" in user_data and user_data["password"]:
        user_data["hashed_password"] = get_password_hash(user_data["password"])
        del user_data["password"]

    # Actualizar campos
    for field, value in user_data.items():
        setattr(current_user, field, value)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


# ==========================================
# 2. RUTAS PÚBLICAS O LISTADOS
# ==========================================

@router.get("/concejales", response_model=List[UserPublic])
def read_concejales(session: Session = Depends(get_session)):
    """
    Lista pública del equipo (solo activos).
    """
    users = session.exec(select(User).where(User.is_active == True)).all()
    return users


@router.get("/", response_model=List[UserPublic])
def read_users(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Listar todos los usuarios (Solo Admin/Estructura).
    """
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    users = session.exec(select(User).order_by(User.id)).all()
    return users


@router.post("/", response_model=UserPublic)
def create_user(
        user_in: UserCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Crear usuario (Solo Admin).
    """
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(status_code=403, detail="Solo el Admin puede crear usuarios")

    existing_user = session.exec(select(User).where(User.email == user_in.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya existe")

    user = User.model_validate(
        user_in,
        update={"hashed_password": get_password_hash(user_in.password)}
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# ==========================================
# 3. RUTAS DINÁMICAS ({user_id})
# ==========================================
# Estas van AL FINAL porque {user_id} atrapa cualquier cosa

@router.put("/{user_id}", response_model=UserPublic)
def update_user(
        user_id: int,
        user_in: UserUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Editar cualquier usuario (Solo Admin).
    """
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar")

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

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
    Eliminar usuario (Solo Admin).
    """
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    session.delete(user)
    session.commit()
    return {"ok": True}