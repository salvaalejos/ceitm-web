// Catálogo oficial de carreras basado en la Convocatoria Enero-Junio 2026
// Separadas por Campus para futuros filtros

export const CARRERAS = [
    // CAMPUS I (Salida Salamanca)
    { id: 'semiconductores', nombre: 'Ingeniería en Semiconductores', campus: 'I' },
    { id: 'electrica', nombre: 'Ingeniería Eléctrica', campus: 'I' },
    { id: 'electronica', nombre: 'Ingeniería Electrónica', campus: 'I' },
    { id: 'materiales', nombre: 'Ingeniería en Materiales', campus: 'I' },
    { id: 'administracion', nombre: 'Licenciatura en Administración', campus: 'I' },
    { id: 'contador', nombre: 'Contador Público', campus: 'I' },
    { id: 'bioquimica', nombre: 'Ingeniería Bioquímica', campus: 'I' },
    { id: 'mecanica', nombre: 'Ingeniería Mecánica', campus: 'I' },
    { id: 'sistemas', nombre: 'Ingeniería en Sistemas Computacionales', campus: 'I' },
    { id: 'mecatronica', nombre: 'Ingeniería en Mecatronica', campus: 'I' },

    // CAMPUS II (Ciudad del Conocimiento)
    { id: 'gestion', nombre: 'Ingeniería en Gestión Empresarial', campus: 'II' },
    { id: 'ciberseguridad', nombre: 'Ingeniería en Ciberseguridad', campus: 'II' },
    { id: 'tics', nombre: 'Ingeniería en Tics', campus: 'II' },
];

// Helper para obtener nombres simples (útil para Selects)
export const NOMBRES_CARRERAS = CARRERAS.map(c => c.nombre);