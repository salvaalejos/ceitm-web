import {
    Crown, FileText, DollarSign, Scale, // Directiva
    BookOpen, GraduationCap, HeartHandshake, Megaphone, Users, Activity, Palette, // Operativas
    Monitor, Users2, ShieldQuestion // Otros (Sistemas, Consejo, Ninguna)
} from 'lucide-react';

export interface Coordination {
    id: string; // ID interno (match con BD)
    label: string; // Nombre visible
    type: 'directiva' | 'operativa' | 'administrativa' | 'otro';
    allowedRoles: string[]; // Roles que pueden seleccionar esta área
    icon: any;
    description: string;
    modalDescription: string;
    color: string;
    route: string; // Ruta para el botón de acción
}

export const COORDINACIONES: Coordination[] = [
    // --- 1. MESA DIRECTIVA ---
    {
        id: 'PRESIDENCIA',
        label: 'Presidencia',
        type: 'directiva',
        allowedRoles: ['estructura'],
        icon: Crown,
        description: 'Representación oficial del alumnado, liderazgo estratégico y coordinación general del Consejo.',
        modalDescription: 'La Presidencia es la encargada de representar a la comunidad estudiantil ante las autoridades, coordinar a las diferentes áreas y velar por el cumplimiento de los objetivos del Consejo Estudiantil.',
        color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 group-hover:bg-yellow-600 group-hover:text-white',
        route: '/concejales'
    },
    {
        id: 'SECRETARIA',
        label: 'Secretaría General',
        type: 'directiva',
        allowedRoles: ['estructura'],
        icon: FileText,
        description: 'Organización interna, gestión de documentación oficial, minutas y agenda del Consejo.',
        modalDescription: 'La Secretaría General se encarga de la organización interna, el manejo de actas, minutas y la documentación oficial del Consejo, asegurando el orden administrativo.',
        color: 'text-gray-600 bg-gray-100 dark:bg-gray-700/50 group-hover:bg-gray-600 group-hover:text-white',
        route: '/transparencia'
    },
    {
        id: 'TESORERIA',
        label: 'Tesorería',
        type: 'directiva',
        allowedRoles: ['estructura'],
        icon: DollarSign,
        description: 'Administración transparente de recursos, finanzas y gestión de presupuestos para actividades.',
        modalDescription: 'La Tesorería administra los recursos financieros del Consejo con total transparencia, gestionando presupuestos para eventos y apoyos estudiantiles.',
        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-600 group-hover:text-white',
        route: '/transparencia'
    },
    {
        id: 'CONTRALORIA',
        label: 'Contraloría',
        type: 'directiva',
        allowedRoles: ['estructura'],
        icon: Scale,
        description: 'Vigilancia del cumplimiento de estatutos, auditoría interna y transparencia en procesos.',
        modalDescription: 'La Contraloría vigila el cumplimiento de los estatutos y reglamentos, actuando como órgano de control interno para garantizar la legalidad de las acciones del Consejo.',
        color: 'text-blue-gray-600 bg-blue-gray-50 dark:bg-slate-800 group-hover:bg-slate-600 group-hover:text-white',
        route: '/transparencia'
    },

    // --- 2. COORDINACIONES OPERATIVAS ---
    {
        id: 'ACADEMICO',
        label: 'Académico',
        type: 'operativa',
        allowedRoles: ['coordinador', 'vocal'],
        icon: BookOpen,
        description: 'Atención a problemáticas escolares, asesorías y gestión de trámites educativos.',
        modalDescription: 'El área Académica es tu enlace directo para resolver dudas sobre retículas, trámites escolares, problemas con docentes y organización de asesorías entre pares.',
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-600 group-hover:text-white',
        route: '/buzon'
    },
    {
        id: 'BECAS',
        label: 'Becas y Apoyos',
        type: 'operativa',
        allowedRoles: ['coordinador', 'vocal'],
        icon: GraduationCap,
        description: 'Gestión integral de apoyos alimenticios, becas de reinscripción y becas para cursos del CLE.',
        modalDescription: 'Nos encargamos de gestionar, difundir y dar seguimiento a las convocatorias de becas federales, estatales y apoyos propios del ITM (Alimenticia, Reinscripción, CLE).',
        color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 group-hover:bg-orange-600 group-hover:text-white',
        route: '/becas'
    },
    {
        id: 'PREVENCION',
        label: 'Prevención y Logística',
        type: 'operativa',
        allowedRoles: ['coordinador', 'vocal'],
        icon: HeartHandshake,
        description: 'Campañas de impacto social para la comunidad y programas para liberación de servicio becario.',
        modalDescription: 'Coordinamos la logística de eventos masivos y promovemos campañas de prevención, salud y bienestar social dentro de la comunidad tecnológica.',
        color: 'text-red-600 bg-red-50 dark:bg-red-900/20 group-hover:bg-red-600 group-hover:text-white',
        route: '/noticias'
    },
    {
        id: 'COMUNICACION',
        label: 'Comunicación y Difusión',
        type: 'operativa',
        allowedRoles: ['coordinador', 'vocal'],
        icon: Megaphone,
        description: 'Manejo de redes oficiales, diseño de estrategias informativas y difusión de avisos.',
        modalDescription: 'Somos la voz del Consejo. Gestionamos las redes sociales oficiales y aseguramos que la información importante llegue a cada rincón del Tecnológico.',
        color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20 group-hover:bg-pink-600 group-hover:text-white',
        route: '/noticias'
    },
    {
        id: 'VINCULACION',
        label: 'Vinculación',
        type: 'operativa',
        allowedRoles: ['coordinador', 'vocal'],
        icon: Users,
        description: 'Alianzas estratégicas con empresas y sector externo para proyectos de valor curricular.',
        modalDescription: 'Buscamos y gestionamos convenios con empresas, descuentos comerciales y oportunidades externas que beneficien a los estudiantes del ITM.',
        color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-600 group-hover:text-white',
        route: '/convenios'
    },
    {
        id: 'EVENTOS',
        label: 'Eventos (SODECU)',
        type: 'operativa',
        allowedRoles: ['coordinador', 'vocal'],
        icon: Activity,
        description: 'Creación de experiencias culturales, deportivas y recreativas para la integración estudiantil.',
        modalDescription: 'Organizamos la vida estudiantil fuera de las aulas: torneos deportivos, eventos culturales, fiestas de bienvenida y actividades de integración.',
        color: 'text-green-600 bg-green-50 dark:bg-green-900/20 group-hover:bg-green-600 group-hover:text-white',
        route: '/noticias'
    },
    {
        id: 'MARKETING',
        label: 'Marketing y Diseño',
        type: 'operativa',
        allowedRoles: ['coordinador', 'vocal'],
        icon: Palette,
        description: 'Identidad visual institucional, creación de contenido gráfico y branding del Consejo.',
        modalDescription: 'Creamos la imagen del Consejo. Diseñamos todo el material gráfico, fotografía y video para mantener una identidad visual profesional y moderna.',
        color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-600 group-hover:text-white',
        route: '/noticias'
    },

    // --- 3. OTROS / ADMINISTRATIVOS ---
    {
        id: 'CONSEJO_GENERAL',
        label: 'Consejo General',
        type: 'otro',
        allowedRoles: ['vocal', 'concejal'],
        icon: Users2,
        description: 'Cuerpo general de concejales y representantes.',
        modalDescription: 'Representantes de cada carrera ante el Consejo.',
        color: 'text-gray-500',
        route: '/concejales'
    },
    {
        id: 'SISTEMAS',
        label: 'Sistemas',
        type: 'administrativa',
        allowedRoles: ['admin_sys'],
        icon: Monitor,
        description: 'Administración de la plataforma.',
        modalDescription: 'Administración de la plataforma.',
        color: 'text-slate-800',
        route: '/'
    },
    {
        id: 'NINGUNA',
        label: 'Ninguna',
        type: 'otro',
        allowedRoles: ['concejal', 'alumno'],
        icon: ShieldQuestion,
        description: 'Sin asignación específica.',
        modalDescription: 'Sin asignación.',
        color: 'text-gray-400',
        route: '/'
    }
];

// Helper para obtener áreas por rol (Usado en UserForm)
export const getAreasByRole = (role: string): string[] => {
    return COORDINACIONES
        .filter(c => c.allowedRoles.includes(role))
        .map(c => c.label);
};