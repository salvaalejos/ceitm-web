from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.database import get_session
from app.core.security import get_password_hash
from app.models.user_model import User, UserRole
from app.schemas.user_schema import UserPublic, UserCreate, UserUpdate, UserUpdateMe
from app.api.deps import get_current_user
from app.core.audit_logger import log_action

router = APIRouter()

# --- ESQUEMAS PARA PAGINACIÓN ---
class PaginatedUsers(BaseModel):
    total: int
    items: List[UserPublic]


# ==========================================
# 1. RUTAS DE "MI PERFIL" (PRIORIDAD ALTA)
# ==========================================

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
    user_data = user_in.model_dump(exclude_unset=True)

    if "password" in user_data and user_data["password"]:
        user_data["hashed_password"] = get_password_hash(user_data["password"])
        del user_data["password"]

    for field, value in user_data.items():
        setattr(current_user, field, value)

    session.add(current_user)

    # 👇 LOG: Auto-edición
    log_action(
        session=session,
        user=current_user,
        action="UPDATE_PROFILE",
        module="USUARIOS",
        details="El usuario actualizó su propio perfil",
        resource_id=str(current_user.id)
    )

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


# 👇 NUEVO ENDPOINT: Trae TODOS los activos para los Selects/Dropdowns
@router.get("/all", response_model=List[UserPublic])
def read_all_active_users(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos")
    # Solo traemos a los activos ordenados alfabéticamente
    users = session.exec(select(User).where(User.is_active == True).order_by(User.full_name)).all()
    return users


@router.get("/", response_model=PaginatedUsers)
def read_users(
        skip: int = Query(0, ge=0),
        limit: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(None),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Listar todos los usuarios de forma paginada y con búsqueda (Solo Admin/Estructura).
    """
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    # 1. Consulta base
    base_query = select(User)

    # 2. Si hay búsqueda, filtramos por nombre, correo o rol
    if search:
        base_query = base_query.where(
            (User.full_name.icontains(search)) |
            (User.email.icontains(search)) |
            (User.role.icontains(search))
        )

    # 3. Contamos el total de registros de forma segura para SQLite
    all_matching_users = session.exec(base_query).all()
    total = len(all_matching_users)

    # 4. Traemos solo la página solicitada
    query = base_query.order_by(User.id).offset(skip).limit(limit)
    users = session.exec(query).all()

    return PaginatedUsers(total=total, items=users)


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

    # 👇 LOG: Creación de usuario
    log_action(
        session=session,
        user=current_user,
        action="CREATE",
        module="USUARIOS",
        details=f"Creó al usuario {user.email} con rol {user.role}",
        resource_id=None
    )

    session.commit()
    session.refresh(user)
    return user


# ==========================================
# 3. RUTAS DINÁMICAS ({user_id})
# ==========================================

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

    # 👇 LOG: Edición administrativa
    log_action(
        session=session,
        user=current_user,
        action="UPDATE",
        module="USUARIOS",
        details=f"Editó datos del usuario {db_user.email}",
        resource_id=str(user_id)
    )

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

    user_email_deleted = user.email

    session.delete(user)

    # 👇 LOG: Eliminación
    log_action(
        session=session,
        user=current_user,
        action="DELETE",
        module="USUARIOS",
        details=f"Eliminó al usuario {user_email_deleted}",
        resource_id=str(user_id)
    )

    session.commit()
    return {"ok": True}