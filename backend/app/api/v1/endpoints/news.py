from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from slugify import slugify
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_session
from app.models.news_model import News
from app.models.user_model import User, UserRole
from app.schemas.news_schema import NewsCreate, NewsUpdate, NewsPublic
from app.api.deps import get_current_user
from app.core.audit_logger import log_action

router = APIRouter()


# 👇 NUEVO: Esquema de Paginación
class PaginatedNews(BaseModel):
    total: int
    items: List[NewsPublic]


# ==========================================
# 1. PÚBLICO: OBTENER NOTICIAS PUBLICADAS
# ==========================================
@router.get("/public", response_model=List[NewsPublic])
def read_public_news(
        session: Session = Depends(get_session),
        category: Optional[str] = Query(None, description="Filtrar por categoría (ej. BECAS, ACADEMICO)")
):
    """
    Obtener SOLO noticias publicadas para la vista de alumnos.
    """
    statement = select(News).where(News.is_published == True)
    if category:
        statement = statement.where(News.category == category)

    statement = statement.order_by(News.created_at.desc())
    news = session.exec(statement).all()
    return news


# ==========================================
# 2. PRIVADO: ADMIN LISTADO PAGINADO (INCLUYE BORRADORES)
# ==========================================
@router.get("/", response_model=PaginatedNews)
def read_admin_news(
        skip: int = Query(0, ge=0),
        limit: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(None),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Listar todas las noticias (Paginado) para el administrador.
    """
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No autorizado")

    base_query = select(News)

    if search:
        base_query = base_query.where(
            (News.title.icontains(search)) |
            (News.category.icontains(search)) |
            (News.excerpt.icontains(search))
        )

    all_matching = session.exec(base_query).all()
    total = len(all_matching)

    query = base_query.order_by(News.created_at.desc()).offset(skip).limit(limit)
    news = session.exec(query).all()

    return PaginatedNews(total=total, items=news)


# ==========================================
# 3. PRIVADO: CREAR NOTICIA
# ==========================================
@router.post("/", response_model=NewsPublic)
def create_news(
        news_in: NewsCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    base_slug = slugify(news_in.title)
    slug = base_slug
    counter = 1

    while session.exec(select(News).where(News.slug == slug)).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    news = News.model_validate(news_in, update={"slug": slug, "author_id": current_user.id})
    session.add(news)
    session.commit()
    session.refresh(news)

    log_action(
        session=session,
        user=current_user,
        action="CREATE",
        module="NOTICIAS",
        details=f"Publicó noticia: {news.title} (Cat: {news.category})",
        resource_id=str(news.id)
    )
    session.commit()
    return news


# ==========================================
# 4. PRIVADO: EDITAR NOTICIA
# ==========================================
@router.put("/{news_id}", response_model=NewsPublic)
def update_news(
        news_id: int,
        news_in: NewsUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    news = session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")

    news_data = news_in.model_dump(exclude_unset=True)
    news_data["updated_at"] = datetime.utcnow()

    for key, value in news_data.items():
        setattr(news, key, value)

    session.add(news)
    session.commit()
    session.refresh(news)

    log_action(
        session=session,
        user=current_user,
        action="UPDATE",
        module="NOTICIAS",
        details=f"Editó noticia: {news.title}",
        resource_id=str(news.id)
    )
    session.commit()
    return news


# ==========================================
# 5. PRIVADO: ELIMINAR NOTICIA
# ==========================================
@router.delete("/{news_id}")
def delete_news(
        news_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    news = session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")

    news_title = news.title
    session.delete(news)

    log_action(
        session=session,
        user=current_user,
        action="DELETE",
        module="NOTICIAS",
        details=f"Eliminó noticia: {news_title}",
        resource_id=str(news_id)
    )

    session.commit()
    return {"ok": True}


# ==========================================
# 6. PÚBLICO: LEER NOTICIA POR SLUG (Debe ir al final)
# ==========================================
@router.get("/{slug}", response_model=NewsPublic)
def read_single_news(slug: str, session: Session = Depends(get_session)):
    news = session.exec(select(News).where(News.slug == slug)).first()
    if not news:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    return news