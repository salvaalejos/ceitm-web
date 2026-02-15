// --- USUARIOS Y ESTRUCTURA ---

export enum UserRole {
  ADMIN_SYS = "admin_sys",
  ESTRUCTURA = "estructura",
  COORDINADOR = "coordinador",
  CONCEJAL = "concejal",
  VOCAL = "vocal"
}

export enum UserArea {
  PRESIDENCIA = 'Presidencia',
  SECRETARIA = 'Secretaría General',
  TESORERIA = 'Tesorería',
  CONTRALORIA = 'Contraloría',
  ACADEMICO = 'Académico',
  VINCULACION = 'Vinculación',
  BECAS = 'Becas y Apoyos',
  COMUNICACION = 'Comunicación y Difusión',
  EVENTOS = 'Eventos (SODECU)',
  PREVENCION = 'Prevención y Logística',
  MARKETING = 'Marketing y Diseño',
  CONSEJO_GENERAL = 'Consejo General',
  SISTEMAS = 'Sistemas',
  NINGUNA = 'Ninguna',
}

// Interfaces auxiliares para respuestas "Mini" de usuarios en tablas
export interface ShiftUser {
  id: number;
  full_name: string;
  area: string;
  role: string;
}

export interface SanctionUser {
  id: number;
  full_name: string;
  area: string;
  role: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  area: UserArea;      // Nuevo campo
  is_active: boolean;
  career?: string;

  // Opcionales
  imagen_url?: string;
  phone_number?: string;
  instagram_url?: string;

  // Relaciones opcionales (si se cargan)
  sanctions?: Sanction[];
  shifts?: Shift[];
}

export interface LoginCredentials {
  email: string;
  password_hash: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  web?: string;
}

export interface Career {
  id: number;
  name: string;
  slug: string;
  whatsapp_url?: string;
  image_url?: string;
  is_active: boolean;
}

export interface Convenio {
  id: number;
  nombre: string;
  descripcion_corta: string;
  descripcion_larga: string;
  categoria: string;
  imagen_url: string;
  direccion: string;
  beneficios: string[];
  social_links: SocialLinks;
}

// --- CONTRALORÍA: SANCIONES ---

export enum SanctionSeverity {
  LEVE = "Leve",
  NORMAL = "Normal",
  GRAVE = "Grave"
}

export enum SanctionStatus {
  PENDIENTE = "Pendiente",
  SALDADA = "Saldada"
}

export interface Sanction {
  id: number;
  user_id: number;
  severity: SanctionSeverity;
  reason: string;
  penalty_description: string;
  status: SanctionStatus;
  created_at: string;
  user?: SanctionUser; // Datos expandidos del usuario sancionado
}

// --- CONTRALORÍA: GUARDIAS (SHIFTS) ---

export enum DayOfWeek {
  LUNES = "Lunes",
  MARTES = "Martes",
  MIERCOLES = "Miércoles",
  JUEVES = "Jueves",
  VIERNES = "Viernes"
}

export interface Shift {
  id: number;
  user_id: number;
  day: DayOfWeek;
  hour: number; // Formato 24h (7 a 19)
  user?: ShiftUser; // Datos expandidos del usuario en guardia
}

// --- BECAS ---

export enum ScholarshipType {
  ALIMENTICIA = "Alimenticia",
  REINSCRIPCION = "Reinscripción",
  CLE = "CLE (Idiomas)",
  OTRA = "Otra"
}

export enum ApplicationStatus {
  PENDIENTE = "Pendiente",
  EN_REVISION = "En Revisión",
  APROBADA = "Aprobada",
  RECHAZADA = "Rechazada",
  DOCUMENTACION_FALTANTE = "Documentación Faltante",
  LIBERADA = "Liberada" // Nuevo estatus
}

export enum ScholarshipPeriod {
  ENE_JUN = "Enero-Junio",
  AGO_DIC = "Agosto-Diciembre",
  VERANO = "Verano"
}

// --- CUPOS (QUOTAS) ---
export interface ScholarshipQuota {
  id: number;
  scholarship_id: number;
  career_name: string;
  total_slots: number;      // Definidos por coordinador
  used_slots: number;       // Aprobados reales
  available_slots: number;  // Calculado (total - used)
}

export interface Scholarship {
  id: number;
  name: string;
  type: ScholarshipType;
  description: string;
  start_date: string;
  end_date: string;
  results_date: string;

  // Nuevos campos de configuración de Folio
  year: number;
  period: ScholarshipPeriod;
  folio_identifier: string;

  is_active: boolean;
  quotas?: ScholarshipQuota[];
}

export interface ScholarshipCreate extends Omit<Scholarship, 'id' | 'quotas'> {}
export interface ScholarshipUpdate extends Partial<ScholarshipCreate> {}

export interface ScholarshipApplication {
  id: number;
  scholarship_id: number;
  scholarship_name?: string;

  // Datos Personales
  full_name: string;
  email: string;
  control_number: string;
  phone_number: string;
  career: string;
  semester: string;

  // Foto Infantil
  student_photo: string;

  // Específicos CLE
  cle_control_number?: string;
  level_to_enter?: string;

  // Académicos
  arithmetic_average: number;
  certified_average: number;

  // Socioeconómicos
  address: string;
  origin_address: string;
  economic_dependence: string;
  dependents_count: number;
  family_income: number;
  income_per_capita: number;

  // Motivos e Historial
  previous_scholarship?: string;

  // Folio de Liberación
  release_folio?: string;

  activities?: string;
  motivos: string;

  // Documentos (URLs)
  doc_request?: string;
  doc_motivos?: string;
  doc_address?: string;
  doc_income?: string;
  doc_ine?: string;
  doc_school_id?: string;
  doc_kardex?: string;
  doc_extra?: string;

  // Control
  status: ApplicationStatus;
  created_at: string;
  admin_comments?: string;

  // Relación con Alumno (Opcional en frontend)
  student_id?: string;
}

export interface ApplicationUpdate {
  status?: string;
  admin_comments?: string;
}

// --- BUZÓN DE QUEJAS (TICKETS) ---

export enum ComplaintType {
  QUEJA = 'Queja',
  SUGERENCIA = 'Sugerencia',
  AMBAS = 'Ambas',
}

export enum ComplaintStatus {
  PENDIENTE = 'Pendiente',
  EN_PROCESO = 'En Proceso',
  RESUELTO = 'Resuelto',
  RECHAZADO = 'Rechazado',
}

export interface Complaint {
  id: number;

  // Datos del alumno
  full_name: string;
  control_number: string;
  phone_number: string;
  email: string;
  career: string;
  semester: string;

  // Detalle
  type: ComplaintType;
  description: string;
  evidence_url?: string;

  // Sistema de Rastreo
  tracking_code?: string;
  status: ComplaintStatus;

  // Resolución Admin
  admin_response?: string;
  resolution_evidence_url?: string;
  resolved_at?: string;

  created_at: string;
}

// --- MAPA (PONYMAP) ---

export interface Room {
  id: number;
  name: string;
  floor: string; // Ej: "PB", "1", "2"
  type: string;  // Ej: "CLASSROOM", "LAB", "OFFICE", "WC"
  building_id: number;
}

export interface Building {
  id: number;
  name: string;
  code: string; // Ej: "K", "A"
  description?: string;
  category: string; // Ej: "AULAS", "ADMINISTRATIVO", "LABS"
  image_url?: string;
  tags?: string;

  coordinates: {
    lat?: number;
    lng?: number;
    [key: string]: any;
  };

  rooms?: Room[];
}

export interface MapSearchResult {
  id: number;
  type: 'BUILDING' | 'ROOM';
  name: string;
  detail: string;
  building_id: number;
  coordinates: { lat?: number; lng?: number };
  category: string;
}