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
    # La clave secreta debe ser larga y única.
    # En producción, esto NUNCA debe ser valor por defecto, debe leerse del .env
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 días de sesión (ajustable)

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()