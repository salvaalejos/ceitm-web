import logging
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.core.database import engine, init_db
from app.core.security import get_password_hash

# --- IMPORTAMOS TODOS LOS MODELOS ---
from app.models.user_model import User, UserRole, UserArea
from app.models.career_model import Career
from app.models.news_model import News
from app.models.convenio_model import Convenio
# AGREGAMOS ScholarshipQuota AQUÍ
from app.models.scholarship_model import Scholarship, ScholarshipType, ScholarshipQuota
from app.models.complaint_model import Complaint, ComplaintType, ComplaintStatus

# Configuración básica de logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==========================================
# 1. DATOS DE CARRERAS
# ==========================================
CARRERAS_DATA = [
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
    {"slug": "gestion", "name": "Ingeniería en Gestión Empresarial"},
    {"slug": "ciberseguridad", "name": "Ingeniería en Ciberseguridad"},
    {"slug": "tics", "name": "Ingeniería en Tics"},
]


def seed_careers(session: Session):
    logger.info("⏳ Verificando catálogo de carreras...")
    count = 0
    for item in CARRERAS_DATA:
        if not session.exec(select(Career).where(Career.slug == item["slug"])).first():
            session.add(Career(
                name=item["name"],
                slug=item["slug"],
                is_active=True
            ))
            count += 1
    session.commit()
    logger.info(f"✅ {count} carreras agregadas.")


# ==========================================
# 2. DATOS DE NOTICIAS
# ==========================================
NEWS_DATA = [
    {
        "title": "¡Bienvenidos al nuevo Portal CEITM!",
        "slug": "bienvenidos-portal-ceitm",
        "excerpt": "Lanzamos nuestra nueva plataforma digital para estar más conectados.",
        "content": "Estamos orgullosos de presentar la nueva web del Consejo. Aquí podrás tramitar becas, ver convenios y enterarte de todo.",
        "category": "COMUNIDAD",
        "imagen_url": "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
    },
    {
        "title": "Torneo de Fútbol Inter-Carreras",
        "slug": "torneo-futbol-2025",
        "excerpt": "Prepara tu equipo, las inscripciones abren la próxima semana.",
        "content": "El departamento de extraescolares junto con el consejo te invitan al torneo relámpago. Premios a los 3 primeros lugares.",
        "category": "DEPORTES",
        "imagen_url": "https://images.unsplash.com/photo-1579952363873-27f3bde9be51?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
    }
]


def seed_news(session: Session):
    logger.info("⏳ Sembrando noticias...")
    count = 0
    for item in NEWS_DATA:
        if not session.exec(select(News).where(News.slug == item["slug"])).first():
            session.add(News(**item, is_published=True))
            count += 1
    session.commit()
    logger.info(f"✅ {count} noticias agregadas.")


# ==========================================
# 3. DATOS DE CONVENIOS
# ==========================================
CONVENIOS_DATA = [
    {
        "nombre": "Gimnasio PowerFit",
        "descripcion_corta": "20% de descuento en mensualidad.",
        "descripcion_larga": "Presenta tu credencial vigente y obtén descuento en inscripción y mensualidad. Incluye acceso a regaderas.",
        "categoria": "SALUD",
        "imagen_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        "direccion": "Av. Tecnológico #123",
        "beneficios": ["Inscripción GRATIS", "Mensualidad $350"],
        "social_links": {"facebook": "https://facebook.com", "instagram": "https://instagram.com"}
    },
    {
        "nombre": "Papelería El Pony",
        "descripcion_corta": "Copias a 50 centavos.",
        "descripcion_larga": "Todo lo que necesitas para tus proyectos. Impresiones, engargolados y material de dibujo.",
        "categoria": "SERVICIOS",
        "imagen_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        "direccion": "Frente a la puerta 1",
        "beneficios": ["10% en listas de útiles", "Copias B/N $0.50"],
        "social_links": {}
    }
]


def seed_convenios(session: Session):
    logger.info("⏳ Sembrando convenios...")
    count = 0
    for item in CONVENIOS_DATA:
        if not session.exec(select(Convenio).where(Convenio.nombre == item["nombre"])).first():
            session.add(Convenio(**item, is_active=True))
            count += 1
    session.commit()
    logger.info(f"✅ {count} convenios agregados.")


# ==========================================
# 4. DATOS DE BECAS Y CUPOS (LÓGICA CORREGIDA)
# ==========================================
def seed_scholarships(session: Session):
    logger.info("⏳ Sembrando becas...")

    # 1. BECA REINSCRIPCIÓN (ACTIVA)
    beca_active = session.exec(select(Scholarship).where(Scholarship.name == "Beca de Reinscripción 2025")).first()
    if not beca_active:
        beca_active = Scholarship(
            name="Beca de Reinscripción 2025",
            type=ScholarshipType.REINSCRIPCION,
            description="Apoyo para el pago de la inscripción al semestre Enero-Junio 2025.",
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),
            results_date=datetime.utcnow() + timedelta(days=45),
            cycle="2025-1",
            is_active=True
        )
        session.add(beca_active)
        session.commit()
        session.refresh(beca_active)
        logger.info("✅ Beca 'Reinscripción 2025' creada.")

    # 2. BECA ALIMENTICIA (HISTÓRICA)
    beca_old = session.exec(select(Scholarship).where(Scholarship.name == "Beca Alimenticia (Comedor)")).first()
    if not beca_old:
        beca_old = Scholarship(
            name="Beca Alimenticia (Comedor)",
            type=ScholarshipType.ALIMENTICIA,
            description="Desayunos gratuitos.",
            start_date=datetime.utcnow() - timedelta(days=60),
            end_date=datetime.utcnow() - timedelta(days=10),
            results_date=datetime.utcnow() - timedelta(days=5),
            cycle="2024-2",
            is_active=False
        )
        session.add(beca_old)
        session.commit()

    # --- INICIALIZAR CUPOS (CRÍTICO: NO SALTAR ESTO) ---
    logger.info("📊 Verificando Cupos (Quotas) para beca activa...")
    active_careers = session.exec(select(Career).where(Career.is_active == True)).all()

    for career in active_careers:
        # Verificar si ya existe cupo para esta combinación
        existing_quota = session.exec(
            select(ScholarshipQuota)
            .where(ScholarshipQuota.scholarship_id == beca_active.id)
            .where(ScholarshipQuota.career_name == career.name)
        ).first()

        if not existing_quota:
            new_quota = ScholarshipQuota(
                scholarship_id=beca_active.id,
                career_name=career.name,
                total_slots=10,  # 10 lugares por defecto para pruebas
                used_slots=0
            )
            session.add(new_quota)

    session.commit()
    logger.info("✅ Cupos validados/creados.")

# ==========================================
# 5. DATOS DE QUEJAS (Test Dashboard)
# ==========================================
def seed_complaints(session: Session):
    logger.info("⏳ Sembrando queja de prueba...")
    if session.exec(select(Complaint)).first():
        return

    queja = Complaint(
        full_name="Juan Pérez (Alumno Test)",
        control_number="21120000",
        phone_number="4431234567",
        email="juan.test@itm.mx",  # Agregado campo email
        career="Ingeniería en Sistemas Computacionales",
        semester="5to Semestre",
        type=ComplaintType.QUEJA,
        description="Las luces del edificio K están parpadeando mucho y lastiman la vista en clases nocturnas.",
        status=ComplaintStatus.PENDIENTE,
        tracking_code="CEITM-2025-001",
        created_at=datetime.utcnow()
    )
    session.add(queja)
    session.commit()
    logger.info("✅ Queja de prueba agregada (CEITM-2025-001).")


# ==========================================
# 6. USUARIO ADMIN
# ==========================================
def create_superuser(session: Session):
    if session.exec(select(User).where(User.email == "admin@ceitm.mx")).first():
        logger.info("✅ El usuario admin ya existe.")
        return

    logger.info("⏳ Creando usuario administrador...")
    superuser = User(
        email="admin@ceitm.mx",
        full_name="Salvador Alejos (Admin)",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.ADMIN_SYS,
        area=UserArea.SISTEMAS,
        is_active=True,
        career="Ingeniería en Sistemas Computacionales"
    )
    session.add(superuser)
    session.commit()
    logger.info("🚀 ¡Usuario Admin creado! (User: admin@ceitm.mx / Pass: admin123)")


# ==========================================
# MAIN EXECUTION
# ==========================================
if __name__ == "__main__":
    init_db()  # Crea tablas si no existen

    with Session(engine) as session:
        seed_careers(session)
        create_superuser(session)
        seed_news(session)
        seed_convenios(session)
        seed_scholarships(session)
        seed_complaints(session)

    logger.info("✨ Base de datos poblada exitosamente ✨")