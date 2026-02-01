// 1. Detectar entorno y URL base
export const IS_PRODUCTION = import.meta.env.PROD;
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Si la API es "http://localhost:8000/api/v1", esto nos da "http://localhost:8000"
export const BACKEND_URL = API_BASE_URL.replace('/api/v1', '');

// RUTA BASE DE IMÁGENES
export const STATIC_IMAGES_URL = `${BACKEND_URL}/static/images`;

// CATÁLOGO DE IMÁGENES (¡ÚSALAS ASÍ EN TU CÓDIGO!)
export const IMAGES = {
    LOGO: `${STATIC_IMAGES_URL}/logo-consejo.png`,
    HERO_BG: `${STATIC_IMAGES_URL}/hero-bg.jpg`,
    LOGO_BLANCO: `${STATIC_IMAGES_URL}/logo-consejo-blanco.png`,
    // Agrega aquí otras que uses mucho, ej:
    // DEFAULT_AVATAR: `${STATIC_IMAGES_URL}/default-user.png`,
    // LOGIN_BG: `${STATIC_IMAGES_URL}/login-bg.jpg`,
};

// 2. Información General
export const APP_NAME = "CEITM Platform";
export const DOMAIN_URL = IS_PRODUCTION ? 'http://ceitm.ddnsking.com' : 'http://localhost:5173';

// 3. MAPA DE ENDPOINTS (Aquí estandarizamos todo api.ts)
export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/login/access-token',
        ME: '/users/me',
    },
    USERS: {
        BASE: '/users/', // GET lista, POST crear
        BY_ID: (id: number) => `/users/${id}`, // PUT update, DELETE
        CONCEJALES: '/users/concejales', // GET concejales públicos
    },
    CONVENIOS: {
        BASE: '/convenios/',
        BY_ID: (id: number) => `/convenios/${id}`,
    },
    NEWS: {
        BASE: '/noticias/',
        BY_SLUG: (slug: string) => `/noticias/${slug}`,
        BY_ID: (id: number) => `/noticias/${id}`,
    },
    DOCUMENTS: {
        PUBLIC: '/documentos/', // GET públicos
        ADMIN: '/documentos/admin', // GET todos (admin)
        BASE: '/documentos/', // POST crear
        BY_ID: (id: number) => `/documentos/${id}`, // DELETE
    },
    SCHOLARSHIPS: { // Becas
        BASE: '/becas/', // GET activas, POST crear
        APPLY: '/becas/apply', // POST aplicar
        APPLICATIONS: '/becas/applications', // GET solicitudes
        BY_ID: (id: number) => `/becas/${id}`, // PATCH editar convocatoria
        APPLICATION_STATUS: (id: number) => `/becas/applications/${id}`, // PATCH aprobar/rechazar
        CHECK_STATUS: (controlNumber: string) => `/becas/status/${controlNumber}`, // GET alumno
    },
    COMPLAINTS: { // Quejas
        BASE: '/quejas/',
        BY_ID: (id: number) => `/quejas/${id}`, // PATCH status
    },
    UTILS: {
        UPLOAD_IMAGE: '/utils/upload-image',
        UPLOAD_FILE: '/utils/upload/file',
    },
    AUDIT: {
        BASE: '/audit/',
    }
};
