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

    # Valor por defecto: localhost (para desarrollo)
    # En producción lo sobreescribiremos en el archivo .env
    ENVIRONMENT: str = "development"
    #DOMAIN: str = "https://ceitm.ddnsking.com"
    DOMAIN: str = "http://localhost:8000"

    # EMAIL CONFIG (SMTP)
    # Estas variables DEBEN estar en tu archivo .env para que funcione
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str
    MAIL_FROM_NAME: str = "Consejo Estudiantil ITM"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore" # Evita que explote si hay variables extra en el .env

settings = Settings()