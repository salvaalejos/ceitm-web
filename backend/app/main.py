import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # <--- NUEVO
from sqlmodel import Session, select
from app.core.database import init_db, get_session
from app.core.config import settings
from app.api.v1.endpoints import convenios, login, utils, users, news, documents # <--- Importar


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Iniciando CEITM Platform...")
    # Asegurar que el directorio de estáticos exista
    static_path = "static/images"
    if not os.path.exists(static_path):
        os.makedirs(static_path)
        print(f"📁 Directorio creado: {static_path}")

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

# --- CONFIGURACIÓN CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SERVIR ARCHIVOS ESTÁTICOS (IMÁGENES) ---
# Esto hace que todo lo que esté en /backend/static sea accesible en /static
# Ej: http://localhost:8000/static/images/flyer.jpg
app.mount("/static", StaticFiles(directory="static"), name="static")

# Registro de rutas
app.include_router(convenios.router, prefix="/api/v1/convenios", tags=["Convenios"])
app.include_router(login.router, prefix="/api/v1", tags=["Auth"])
app.include_router(utils.router, prefix="/api/v1/utils", tags=["Utilidades"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Usuarios"])
app.include_router(news.router, prefix="/api/v1/noticias", tags=["Noticias"])
app.include_router(documents.router, prefix="/api/v1/documentos", tags=["Transparencia"])

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