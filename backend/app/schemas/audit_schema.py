from sqlmodel import SQLModel
from datetime import datetime
from typing import Optional

class AuditLogRead(SQLModel):
    id: int
    user_email: str
    user_role: str
    action: str
    module: str
    details: Optional[str]
    created_at: datetime