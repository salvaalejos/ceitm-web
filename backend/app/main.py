from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware  # <--- 1. IMPORTAR ESTO
from sqlmodel import Session, select
from app.core.database import init_db, get_session
from app.core.config import settings

from app.api.v1.endpoints import convenios

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Iniciando CEITM Platform...")
    try:
        init_db()
        print("✅ Base de Datos conectada y tablas creadas.")
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
    yield
    print("👋 Apagando sistema...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# --- 2. CONFIGURACIÓN CORS (SOLUCIÓN A TU ERROR) ---
# Esto permite que el puerto 5173 (React) hable con el 8000 (FastAPI)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------------------------------------

# Registro de rutas
app.include_router(convenios.router, prefix="/api/v1/convenios", tags=["Convenios"])

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido a la API del CEITM", "estado": "operativo"}

@app.get("/db-test")
def test_db_connection(session: Session = Depends(get_session)):
    try:
        session.exec(select(1))
        return {"estado_bd": "Conectada correctamente 🟢"}
    except Exception as e:
        return {"estado_bd": f"Error de conexión 🔴: {str(e)}"}