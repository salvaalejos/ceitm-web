import logging
from sqlmodel import Session, select
from app.core.database import engine, init_db
from app.core.security import get_password_hash
# Importamos modelos necesarios
from app.models.user_model import User, UserRole, UserArea
from app.models.career_model import Career  # <--- Importar Modelo Carrera

# Configuración básica de logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- DATOS SEMILLA (Copia fiel de carreras.ts) ---
CARRERAS_DATA = [
    # CAMPUS I
    {"slug": "semiconductores", "name": "Ingeniería en Semiconductores"},
    {"slug": "electrica", "name": "Ingeniería Eléctrica"},
    {"slug": "electronica", "name": "Ingeniería Electrónica"},
    {"slug": "materiales", "name": "Ingeniería en Materiales"},
    {"slug": "administracion", "name": "Licenciatura en Administración"},
    {"slug": "contador", "name": "Contador Público"},
    {"slug": "bioquimica", "name": "Ingeniería Bioquímica"},
    {"slug": "mecanica", "name": "Ingeniería Mecánica"},
    {"slug": "sistemas", "name": "Ingeniería en Sistemas Computacionales"},
    {"slug": "mecatronica", "name": "Ingeniería en Mecatronica"},

    # CAMPUS II
    {"slug": "gestion", "name": "Ingeniería en Gestión Empresarial"},
    {"slug": "ciberseguridad", "name": "Ingeniería en Ciberseguridad"},
    {"slug": "tics", "name": "Ingeniería en Tics"},
]


def seed_careers():
    """
    Llena la tabla de carreras automáticamente basándose en la lista oficial.
    """
    with Session(engine) as session:
        logger.info("⏳ Verificando catálogo de carreras...")
        count_new = 0

        for item in CARRERAS_DATA:
            # 1. Verificar si ya existe por slug
            career = session.exec(select(Career).where(Career.slug == item["slug"])).first()

            if not career:
                # 2. Crear si no existe
                new_career = Career(
                    name=item["name"],
                    slug=item["slug"],
                    is_active=True,
                    whatsapp_url=None  # Se deja null para que el Admin lo ponga después
                )
                session.add(new_career)
                count_new += 1

        session.commit()
        if count_new > 0:
            logger.info(f"✅ Se agregaron {count_new} carreras nuevas al catálogo.")
        else:
            logger.info("👌 El catálogo de carreras ya estaba actualizado.")


def create_superuser():
    with Session(engine) as session:
        # 1. Verificar si ya existe el superusuario
        user = session.exec(select(User).where(User.email == "admin@ceitm.mx")).first()

        if user:
            logger.info("✅ El usuario admin ya existe.")
            return

        # 2. Crear el usuario si no existe
        logger.info("⏳ Creando usuario administrador...")

        superuser = User(
            email="admin@ceitm.mx",
            full_name="Salvador Alejos (Admin)",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN_SYS,
            area=UserArea.SISTEMAS,
            is_active=True,
            career="Ingeniería en Sistemas Computacionales"  # Actualizado al nombre real
        )

        session.add(superuser)
        session.commit()
        logger.info("🚀 ¡Usuario Admin creado exitosamente!")
        logger.info(f'📧 Email: {superuser.email}')
        logger.info("🔑 Pass: admin123")


if __name__ == "__main__":
    # Aseguramos que las tablas existan
    init_db()

    # Ejecutamos los seeders
    seed_careers()  # <--- Primero carreras
    create_superuser()  # <--- Luego usuarios