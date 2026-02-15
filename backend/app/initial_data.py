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
from app.models.scholarship_model import Scholarship, ScholarshipType, ScholarshipQuota, ScholarshipPeriod
from app.models.complaint_model import Complaint, ComplaintType, ComplaintStatus
from app.models.map_model import Building, Room
from app.models.student_model import Student
from app.models.sanction_model import Sanction, SanctionSeverity, SanctionStatus
from app.models.shift_model import Shift, DayOfWeek

# Configuración básica de logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==========================================
# 1. DATOS DE CARRERAS (REALES)
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
            session.add(Career(name=item["name"], slug=item["slug"], is_active=True))
            count += 1
    session.commit()
    logger.info(f"✅ {count} carreras agregadas.")


# ==========================================
# 2. DATOS DE NOTICIAS (REALES)
# ==========================================
NEWS_DATA = [
    {
        "title": "¡Bienvenidos al nuevo Portal CEITM!",
        "slug": "bienvenidos-portal-ceitm",
        "excerpt": "Lanzamos nuestra nueva plataforma digital para estar más conectados.",
        "content": "Estamos orgullosos de presentar la nueva web del Consejo. Aquí podrás tramitar becas, ver convenios y enterarte de todo.",
        "category": "COMUNIDAD",
        "imagen_url": "https://images.unsplash.com/photo-1523580494863-6f3031224c94"
    },
    {
        "title": "Torneo de Fútbol Inter-Carreras",
        "slug": "torneo-futbol-2025",
        "excerpt": "Prepara tu equipo, las inscripciones abren la próxima semana.",
        "content": "El departamento de extraescolares junto con el consejo te invitan al torneo relámpago.",
        "category": "DEPORTES",
        "imagen_url": "https://images.unsplash.com/photo-1579952363873-27f3bde9be51"
    }
]


def seed_news(session: Session):
    logger.info("⏳ Sembrando noticias...")
    for item in NEWS_DATA:
        if not session.exec(select(News).where(News.slug == item["slug"])).first():
            session.add(News(**item, is_published=True))
    session.commit()


# ==========================================
# 3. DATOS DE CONVENIOS (REALES)
# ==========================================
CONVENIOS_DATA = [
    {
        "nombre": "Gimnasio PowerFit",
        "descripcion_corta": "20% de descuento en mensualidad.",
        "descripcion_larga": "Presenta tu credencial vigente y obtén descuento en inscripción y mensualidad.",
        "categoria": "SALUD",
        "imagen_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
        "direccion": "Av. Tecnológico #123",
        "beneficios": ["Inscripción GRATIS", "Mensualidad $350"],
        "social_links": {"facebook": "https://facebook.com", "instagram": "https://instagram.com"}
    },
    {
        "nombre": "Papelería El Pony",
        "descripcion_corta": "Copias a 50 centavos.",
        "descripcion_larga": "Todo lo que necesitas para tus proyectos. Impresiones, engargolados y material de dibujo.",
        "categoria": "SERVICIOS",
        "imagen_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
        "direccion": "Frente a la puerta 1",
        "beneficios": ["10% en listas de útiles", "Copias B/N $0.50"]
    }
]


def seed_convenios(session: Session):
    logger.info("⏳ Sembrando convenios...")
    for item in CONVENIOS_DATA:
        if not session.exec(select(Convenio).where(Convenio.nombre == item["nombre"])).first():
            session.add(Convenio(**item, is_active=True))
    session.commit()


# ==========================================
# 4. BECAS Y ESTUDIANTES (Lógica de Expedientes)
# ==========================================
def seed_scholarships_and_students(session: Session):
    logger.info("⏳ Sembrando Becas y Expedientes...")

    # 1. Crear Beca
    beca = session.exec(select(Scholarship).where(Scholarship.name == "Beca de Reinscripción 2026")).first()
    if not beca:
        beca = Scholarship(
            name="Beca de Reinscripción 2026",
            type=ScholarshipType.REINSCRIPCION,
            description="Apoyo semestre Ene-Jun 2026",
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),
            results_date=datetime.utcnow() + timedelta(days=45),
            year=2026, period=ScholarshipPeriod.ENE_JUN, folio_identifier="REI", is_active=True
        )
        session.add(beca)
        session.commit()

    # 2. Crear Estudiante de Prueba (CORREGIDO)
    student_control = "21120538"
    if not session.exec(select(Student).where(Student.control_number == student_control)).first():
        # Buscamos la carrera para obtener su ID real
        career = session.exec(select(Career).where(Career.slug == "sistemas")).first()
        if career:
            student = Student(
                control_number=student_control,
                full_name="Salvador Alejos Soria",
                email="21120538@morelia.tecnm.mx",
                phone_number="4431126867",
                career_id=career.id,  # Asignamos ID, no string
                is_blacklisted=False
            )
            session.add(student)
            session.commit()
            logger.info(f"✅ Expediente creado para {student_control}")


# ==========================================
# 5. CONTRALORÍA: GUARDIAS Y SANCIONES
# ==========================================
def seed_contraloria(session: Session, admin_id: int):
    logger.info("⏳ Sembrando datos de Contraloría...")

    if not session.exec(select(Shift).where(Shift.user_id == admin_id)).first():
        session.add(Shift(user_id=admin_id, day=DayOfWeek.LUNES, hour=9))
        session.add(Shift(user_id=admin_id, day=DayOfWeek.MIERCOLES, hour=11))

    if not session.exec(select(Sanction).where(Sanction.user_id == admin_id)).first():
        session.add(Sanction(
            user_id=admin_id,
            severity=SanctionSeverity.NORMAL,
            reason="Retardo en guardia",
            penalty_description="Horas extra de servicio",
            status=SanctionStatus.PENDIENTE
        ))
    session.commit()


# ==========================================
# 6. DATOS DEL MAPA (PonyMap COMPLETO)
# ==========================================
def seed_map(session: Session):
    logger.info("🗺️  Sembrando PonyMap (Datos Reales)...")
    if session.exec(select(Building)).first():
        return

    buildings_data = [
        {
            "name": "Edificio A", "code": "A", "category": "AULAS",
            "description": "Ciencias Básicas. Aulas de tronco común y laboratorios de química.",
            "coordinates": {"lat": 19.723023321057774, "lng": -101.1858332103096},
            "tags": "basicas, quimica, tronco comun, a",
            "rooms": [
                {"name": "A1", "floor": "PB", "type": "CLASSROOM"},
                {"name": "Lab. Química", "floor": "1", "type": "LAB"},
                {"name": "A4", "floor": "1", "type": "CLASSROOM"},
            ]
        },
        {
            "name": "Biblioteca", "code": "BIB", "category": "SERVICIOS",
            "description": "Centro de Información 'Reyes Heroles'.",
            "coordinates": {"lat": 19.7210390161279, "lng": -101.18386184655269},
            "tags": "libros, estudio, bib",
            "rooms": [
                {"name": "Sala General", "floor": "PB", "type": "CLASSROOM"},
                {"name": "Ciberteca", "floor": "1", "type": "PC"},
                {"name": "Pony Papeleria", "floor": "PB", "type": "OFFICE"},
                {"name": "Cubículos 10-20", "floor": "PB", "type": "OFFICE"},
            ]
        },
        {"name": "Edificio AE", "code": "AE", "category": "AULAS", "description": "",
         "coordinates": {"lat": 19.72112977610549, "lng": -101.18422121178249}, "tags": "", "rooms": []},
        {"name": "Edificio Y", "code": "Y", "category": "AULAS", "description": "Edificio de electrónica",
         "coordinates": {"lat": 19.721138469776836, "lng": -101.18454773335725}, "tags": "laboratorios", "rooms": []},
        {"name": "Edificio AG", "code": "AG", "category": "AULAS", "description": "Aulas de mecatrónica",
         "coordinates": {"lat": 19.723177991744798, "lng": -101.18417754618817}, "tags": "isc", "rooms": []},
        {
            "name": "Edificio CH", "code": "CH", "category": "AULAS",
            "description": "Edificio de Ingeniería Industrial",
            "coordinates": {"lat": 19.723500611528852, "lng": -101.18509148344852},
            "tags": "industrial",
            "rooms": [{"name": "B1", "floor": "PB", "type": "CLASSROOM"}]
        },
        {"name": "Oficinas CLE", "code": "CLE", "category": "ADMINISTRATIVO", "description": "Idiomas",
         "coordinates": {"lat": 19.723220400458825, "lng": -101.1848914107995}, "tags": "cle", "rooms": []},
        {
            "name": "Pony Cafeteria", "code": "PC", "category": "ALIMENTOS",
            "description": "Cafetería principal",
            "coordinates": {"lat": 19.721500210923022, "lng": -101.18563347406631},
            "tags": "comida",
            "rooms": [{"name": "Comedor Principal", "floor": "PB", "type": "FOOD"}]
        },
        {"name": "Edificio S1 (CEITM)", "code": "CEITM", "category": "ADMINISTRATIVO",
         "description": "Oficinas consejo", "coordinates": {"lat": 19.721421968157234, "lng": -101.18695225413808},
         "tags": "ceitm", "rooms": []},
        {"name": "Auditorio 'Heber Soto Fierro'", "code": "AUD", "category": "SERVICIOS", "description": "Auditorio",
         "coordinates": {"lat": 19.721196679945653, "lng": -101.18614255842411}, "tags": "gym", "rooms": []},
        {
            "name": "Edificio K", "code": "K", "category": "AULAS",
            "description": "Ingeniería en Sistemas Computacionales.",
            "coordinates": {"lat": 19.72205538251936, "lng": -101.18574221404555},
            "tags": "isc, k",
            "rooms": [{"name": "Centro de Cómputo", "floor": "PB", "type": "PC"}]
        },
        {
            "name": "Edificio I", "code": "I", "category": "ADMINISTRATIVO",
            "description": "Edificio administrativo de sistemas",
            "coordinates": {"lat": 19.722287740673877, "lng": -101.18539284384457},
            "tags": "isc",
            "rooms": [{"name": "Jefatura de ISC", "floor": "PB", "type": "OFFICE"}]
        }
    ]

    for b_data in buildings_data:
        rooms_data = b_data.pop("rooms")
        building = Building(**b_data)
        session.add(building)
        session.commit()
        session.refresh(building)
        for r_data in rooms_data:
            session.add(Room(**r_data, building_id=building.id))
    session.commit()
    logger.info("✅ PonyMap poblado.")


# ==========================================
# 7. USUARIO ADMIN
# ==========================================
def create_superuser(session: Session):
    user = session.exec(select(User).where(User.email == "admin@ceitm.mx")).first()
    if not user:
        user = User(
            email="admin@ceitm.mx",
            full_name="Salvador Alejos (Admin)",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN_SYS,
            area=UserArea.SISTEMAS,
            is_active=True,
            career="Ingeniería en Sistemas Computacionales"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


if __name__ == "__main__":
    init_db()
    with Session(engine) as session:
        seed_careers(session)
        admin = create_superuser(session)
        seed_news(session)
        seed_convenios(session)
        seed_scholarships_and_students(session)
        seed_contraloria(session, admin.id)
        seed_map(session)
    logger.info("✨ Sistema actualizado exitosamente ✨")