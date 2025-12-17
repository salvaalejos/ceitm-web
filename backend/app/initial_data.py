import logging
from sqlmodel import Session, select
from app.core.database import engine, init_db
from app.models.user_model import User, UserRole
from app.core.security import get_password_hash
from app.models.user_model import User, UserRole, UserArea

# Configuración básica de logs para ver qué pasa en la consola
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_superuser():
    with Session(engine) as session:
        # 1. Verificar si ya existe el superusuario para no duplicarlo
        user = session.exec(select(User).where(User.email == "admin@ceitm.mx")).first()

        if user:
            logger.info("✅ El usuario admin ya existe. No se hicieron cambios.")
            return

        # 2. Crear el usuario si no existe
        logger.info("⏳ Creando usuario administrador...")

        superuser = User(
            email="admin@ceitm.mx",
            full_name="Salvador Alejos (Admin)",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN_SYS,  # Rol de Jerarquía
            area=UserArea.SISTEMAS,  # Área funcional
            is_active=True,
            career="Sistemas"
        )

        session.add(superuser)
        session.commit()
        logger.info("🚀 ¡Usuario Admin creado exitosamente!")
        logger.info(f'📧 Email: {superuser.email}')
        logger.info("🔑 Pass: admin123")


if __name__ == "__main__":
    # Aseguramos que las tablas existan antes de insertar (por si acaso)
    init_db()
    create_superuser()