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
  PRESIDENCIA: 'Presidencia', // AÑADIDO PARA LA LÓGICA
  BECAS: 'Becas y Apoyos',
  COMUNICACION: 'Comunicación y Difusión',
  MARKETING: 'Marketing y Diseño',
  PYL: 'Prevención y Logística',
  VINCULACION: 'Vinculación',
  CONTRALORIA: 'Contraloría',
  ACADEMICO: 'Académico',
  SISTEMAS: 'Sistemas',
};

export const usePermissions = () => {
  const { user } = useAuthStore();

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
      canManageMap: false,
      canManageContraloria: false,
      canManageBecarios: false,
      user: null
    };
  }

  const role = user.role;
  const area = user.area || '';

  const isAdmin = role === ROLES.ADMIN_SYS;
  const isEstructura = role === ROLES.ESTRUCTURA;
  const isConcejal = role === ROLES.CONCEJAL;
  const isPresidencia = area === AREAS.PRESIDENCIA;

  // 👇 CORRECCIÓN: Presidencia es Power User automático
  const isPowerUser = isAdmin || isEstructura || isPresidencia;

  const canManageUsers = isPowerUser;

  const isBecasTeam = area === AREAS.BECAS;
  const canManageBecas = isPowerUser || isBecasTeam;

  const canReviewBecas = canManageBecas || isConcejal || role === ROLES.VOCAL || role === ROLES.COORDINADOR || isPowerUser;

  const isVinculacion = area === AREAS.VINCULACION;
  const canManageConvenios = isPowerUser || isVinculacion;

  const isComu = area === AREAS.COMUNICACION || area === AREAS.MARKETING;
  const canManageNoticias = isPowerUser || isComu;

  const canManageQuejas = !!user;
  const canManageMap = isPowerUser;

  // 👇 CORRECCIÓN: Los Power Users (incluyendo Presidencia) pueden gestionar Contraloría
  const isContraloria = area === AREAS.CONTRALORIA;
  const canManageContraloria = isPowerUser || isContraloria;

  const isPyL = area === AREAS.PYL;
  const canManageBecarios = isPowerUser || isPyL || isBecasTeam;

  return {
    user,
    role,
    area,
    isAdmin,
    isEstructura,
    isConcejal,
    isPresidencia,
    canManageUsers,
    canManageBecas,
    canReviewBecas,
    canManageConvenios,
    canManageNoticias,
    canManageQuejas,
    canManageContraloria,
    canManageBecarios,
    canManageMap
  };
};