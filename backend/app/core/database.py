from sqlmodel import SQLModel, create_engine, Session
from .config import settings

# Conexión a la BD usando la URL del .env
# echo=True nos mostrará en consola las consultas SQL (útil para debug)
engine = create_engine(settings.DATABASE_URL, echo=True)

def init_db():
    """Crea las tablas en la BD si no existen al iniciar."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependencia para inyectar la sesión de BD en cada petición."""
    with Session(engine) as session:
        yield session