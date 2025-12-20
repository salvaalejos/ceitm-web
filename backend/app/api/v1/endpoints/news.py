from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from slugify import slugify
from datetime import datetime

from app.core.database import get_session
from app.models.news_model import News
from app.models.user_model import User
from app.schemas.news_schema import NewsCreate, NewsUpdate, NewsPublic
from app.api.deps import get_current_user
# 👇 IMPORTAMOS EL LOGGER
from app.core.audit_logger import log_action

router = APIRouter()


# --- PUBLICO ---

@router.get("/", response_model=List[NewsPublic])
def read_news(
        session: Session = Depends(get_session),
        limit: int = 10,
        offset: int = 0
):
    """
    Obtener noticias publicadas (paginadas).
    """
    statement = (
        select(News)
        .where(News.is_published == True)
        .order_by(News.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    news = session.exec(statement).all()
    return news


@router.get("/{slug}", response_model=NewsPublic)
def read_single_news(slug: str, session: Session = Depends(get_session)):
    """
    Leer una noticia específica por su URL (slug).
    """
    news = session.exec(select(News).where(News.slug == slug)).first()
    if not news:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    return news


# --- PRIVADO (ADMIN) ---

@router.post("/", response_model=NewsPublic)
def create_news(
        news_in: NewsCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Crear nueva noticia.
    """
    # Generar slug único
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

    # 👇 LOG: Creación de noticia
    log_action(
        session=session,
        user=current_user,
        action="CREATE",
        module="NOTICIAS",
        details=f"Publicó noticia: {news.title}",
        resource_id=str(news.id)
    )
    session.commit()

    return news


@router.put("/{news_id}", response_model=NewsPublic)
def update_news(
        news_id: int,
        news_in: NewsUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    """
    Editar noticia.
    """
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

    # 👇 LOG: Edición de noticia
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


@router.delete("/{news_id}")
def delete_news(
        news_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    news = session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")

    news_title = news.title  # Guardamos el título para el log

    session.delete(news)

    # 👇 LOG: Eliminación de noticia
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