from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel
from app.models.document_model import DocumentCategory

class DocumentBase(SQLModel):
    title: str
    description: Optional[str] = None
    file_url: str
    category: DocumentCategory
    is_public: bool = True

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    category: Optional[DocumentCategory] = None
    is_public: Optional[bool] = None

class DocumentPublic(DocumentBase):
    id: int
    created_at: datetime