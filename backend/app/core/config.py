from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "CEITM Platform"

    # Base de Datos
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_SERVER: str
    POSTGRES_PORT: str
    DATABASE_URL: str

    # --- SEGURIDAD (JWT) ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    # 👇 NUEVO: DOMINIO DEL BACKEND
    # Valor por defecto: localhost (para desarrollo)
    # En producción lo sobreescribiremos en el archivo .env
    DOMAIN: str = "http://localhost:8000"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()