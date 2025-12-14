# backend/app/core/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "CEITM Platform"

    # Base de datos
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_SERVER: str
    POSTGRES_PORT: str
    DATABASE_URL: str

    class Config:
        case_sensitive = True
        # Esto le dice a Pydantic que lea el archivo .env de la raíz
        env_file = ".env"


settings = Settings()