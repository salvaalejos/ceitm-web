from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.document_model import Document, DocumentCategory
from app.models.user_model import User, UserRole
from app.schemas.document_schema import DocumentCreate, DocumentUpdate, DocumentPublic
from app.api.deps import get_current_user

router = APIRouter()


# --- PÚBLICO ---

@router.get("/", response_model=List[DocumentPublic])
def read_documents(
    category: Optional[DocumentCategory] = None, # <--- CORRECCIÓN (Usa el Enum o Optional[str])
    session: Session = Depends(get_session)
):
    """
    Obtener lista de documentos públicos.
    """
    query = select(Document).where(Document.is_public == True)

    if category:
        query = query.where(Document.category == category)

    query = query.order_by(Document.created_at.desc())

    docs = session.exec(query).all()
    return docs


# --- PRIVADO (ADMIN) ---

# NUEVO: Ver TODOS los documentos (incluyendo privados)
@router.get("/admin", response_model=List[DocumentPublic])
def read_all_documents(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    # Solo Estructura y Admin pueden ver archivos privados
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    # Traer todo sin filtrar por is_public
    docs = session.exec(select(Document).order_by(Document.created_at.desc())).all()
    return docs

@router.post("/", response_model=DocumentPublic)
def create_document(
        doc_in: DocumentCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    # Solo Admin y Mesa Directiva pueden subir documentos oficiales
    if current_user.role not in [UserRole.ADMIN_SYS, UserRole.ESTRUCTURA]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    doc = Document.model_validate(doc_in)
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc


@router.delete("/{doc_id}")
def delete_document(
        doc_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN_SYS:
        raise HTTPException(status_code=403, detail="Solo el Admin puede borrar documentos")

    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    session.delete(doc)
    session.commit()
    return {"ok": True}