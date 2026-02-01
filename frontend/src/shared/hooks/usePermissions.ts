import { useAuthStore } from '../store/authStore';

// --- CONSTANTES (Espejo de tu backend/models/user_model.py) ---
export const ROLES = {
  ADMIN_SYS: 'admin_sys',
  ESTRUCTURA: 'estructura',
  COORDINADOR: 'coordinador',
  CONCEJAL: 'concejal',
  VOCAL: 'vocal',
};

export const AREAS = {
  BECAS: 'Becas y Apoyos',
  COMUNICACION: 'Comunicación y Difusión',
  MARKETING: 'Marketing y Diseño',
  VINCULACION: 'Vinculación',
  CONTRALORIA: 'Contraloría',
  ACADEMICO: 'Académico',
  SISTEMAS: 'Sistemas',
};

export const usePermissions = () => {
  const { user } = useAuthStore();

  // Si no hay usuario logueado, todo es falso
  if (!user) {
    return {
      isAdmin: false,
      isEstructura: false,
      isConcejal: false,
      canManageUsers: false,
      canManageBecas: false,
      canReviewBecas: false,
      canManageConvenios: false,
      canManageNoticias: false,
      canManageQuejas: false,
      canManageMap: false, // Agregado para seguridad en logout
      user: null
    };
  }

  const role = user.role;
  const area = user.area || ''; // Puede venir undefined

  // --- 1. ROLES BÁSICOS ---
  const isAdmin = role === ROLES.ADMIN_SYS;
  const isEstructura = role === ROLES.ESTRUCTURA;
  const isConcejal = role === ROLES.CONCEJAL;

  // "Power User": Admin y Estructura ven TODO (Regla de oro que definiste)
  const isPowerUser = isAdmin || isEstructura;

  // --- 2. PERMISOS POR MÓDULO (Lógica de Negocio) ---

  // A. USUARIOS
  // Solo Admin y Estructura pueden ver/crear usuarios.
  const canManageUsers = isPowerUser;

  // B. BECAS
  // - Gestión (Crear/Editar Convocatorias): Power Users O Coordinadores del área de Becas
  const isBecasTeam = area === AREAS.BECAS;
  const canManageBecas = isPowerUser || isBecasTeam;

  // - Revisión (Entrar al módulo): Los de arriba + Concejales (para revisar a sus alumnos)
  const canReviewBecas = canManageBecas || isConcejal;

  // C. CONVENIOS
  // Power Users O área de Vinculación
  const isVinculacion = area === AREAS.VINCULACION;
  const canManageConvenios = isPowerUser || isVinculacion;

  // D. NOTICIAS
  // Power Users O áreas de Comunicación/Marketing
  const isComu = area === AREAS.COMUNICACION || area === AREAS.MARKETING;
  const canManageNoticias = isPowerUser || isComu;

  // E. QUEJAS / BUZÓN
  // Power Users O Contraloría O Concejales (suelen ser primer contacto)
  // Nota: Dejamos !!user como pediste (cualquier logueado puede gestionar sus propias quejas o ver dashboard si es admin)
  const canManageQuejas = !!user;

  // F. MAPA (PonyMap)
  // Agregamos esto para mantener la integración del paso anterior.
  // Hereda permisos de Power User (Admin + Estructura)
  const canManageMap = isPowerUser;

  return {
    user,
    role,
    area,
    isAdmin,
    isEstructura,
    isConcejal,
    // Capabilities (Flags de permisos)
    canManageUsers,
    canManageBecas,
    canReviewBecas,
    canManageConvenios,
    canManageNoticias,
    canManageQuejas,
    canManageMap
  };
};