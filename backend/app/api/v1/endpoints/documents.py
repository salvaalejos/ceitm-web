from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.document_model import Document, DocumentCategory
from app.models.user_model import User, UserRole
from app.schemas.document_schema import DocumentCreate, DocumentUpdate, DocumentPublic
from app.api.deps import get_current_user
# 👇 IMPORTAMOS EL LOGGER
from app.core.audit_logger import log_action

router = APIRouter()


# --- PÚBLICO ---

@router.get("/", response_model=List[DocumentPublic])
def read_documents(
        category: Optional[DocumentCategory] = None,
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

# Ver TODOS los documentos (incluyendo privados)
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

    # 👇 LOG: Registro de subida
    log_action(
        session=session,
        user=current_user,
        action="CREATE",
        module="DOCUMENTOS",
        details=f"Subió el documento: {doc.title} ({doc.category})",
        resource_id=str(doc.id)
    )
    session.commit()

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

    doc_title = doc.title  # Guardamos título para el log

    session.delete(doc)

    # 👇 LOG: Registro de eliminación
    log_action(
        session=session,
        user=current_user,
        action="DELETE",
        module="DOCUMENTOS",
        details=f"Eliminó el documento: {doc_title}",
        resource_id=str(doc_id)
    )

    session.commit()
    return {"ok": True}