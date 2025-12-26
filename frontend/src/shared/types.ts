// --- USUARIOS ---
export enum UserRole {
  ADMIN_SYS = "Admin_Sys",
  ESTRUCTURA = "Estructura",
  CONCEJAL = "Concejal"
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole; // Usamos el enum
  is_active: boolean;
  career?: string;

  // Opcionales que tenías
  imagen_url?: string;
  phone_number?: string;
  instagram_url?: string;
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

// --- BECAS ---

// Usamos Enums para coincidir con Backend y evitar errores de "magic strings"
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
  DOCUMENTACION_FALTANTE = "Documentación Faltante"
}

export interface Scholarship {
  id: number;
  name: string;
  type: ScholarshipType;
  description: string;
  start_date: string;
  end_date: string;
  results_date: string;
  cycle: string;
  is_active: boolean;
}

export interface ScholarshipCreate extends Omit<Scholarship, 'id'> {}
export interface ScholarshipUpdate extends Partial<ScholarshipCreate> {}

export interface ScholarshipApplication {
  id: number;
  scholarship_id: number;
  scholarship_name?: string; // Opcional, si el backend lo manda o no

  // Datos Personales
  full_name: string;
  email: string;
  control_number: string;
  phone_number: string;
  career: string;
  semester: string;

  // Específicos CLE (Opcionales)
  cle_control_number?: string;
  level_to_enter?: string;

  // Socioeconómicos
  address: string;
  origin_address: string;
  economic_dependence: string;
  dependents_count: number;
  family_income: number;
  income_per_capita: number;

  // Motivos
  previous_scholarship?: string;
  activities?: string;
  motivos: string;

  // Documentos (URLs)
  doc_request?: string;
  doc_motivos?: string;
  doc_address?: string;
  doc_income?: string;
  doc_ine?: string;
  doc_school_id?: string;
  doc_schedule?: string;
  doc_extra?: string;

  // Control
  status: 'Pendiente' | 'En Revisión' | 'Aprobada' | 'Rechazada' | 'Documentación Faltante';
  created_at: string;
  admin_comments?: string;
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
  EN_PROCESO = 'En Proceso', // Equivalente a "En Revisión" pero para tickets
  RESUELTO = 'Resuelto',
  RECHAZADO = 'Rechazado',
}

export interface Complaint {
  id: number;

  // Datos del alumno
  full_name: string;
  control_number: string;
  phone_number: string;
  email: string; // <--- Nuevo: Requerido para notificaciones
  career: string;
  semester: string;

  // Detalle
  type: ComplaintType;
  description: string;
  evidence_url?: string;

  // Sistema de Rastreo
  tracking_code?: string; // El folio (Ej: CEITM-2025-001)
  status: ComplaintStatus;

  // Resolución Admin
  admin_response?: string;
  resolution_evidence_url?: string;
  resolved_at?: string;

  created_at: string;
}