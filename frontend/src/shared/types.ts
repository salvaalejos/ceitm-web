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
  role: UserRole;
  is_active: boolean;
  career?: string;

  // Opcionales
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

// --- NUEVO: CUPOS (QUOTAS) ---
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
  cycle: string;
  is_active: boolean;
  quotas?: ScholarshipQuota[]; // Matriz de cupos (Opcional)
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

  // NUEVO: Foto Infantil (Ahora es un campo explícito obligatorio)
  student_photo: string;

  // Específicos CLE (Opcionales)
  cle_control_number?: string;
  level_to_enter?: string;

  // Académicos (NUEVOS - Requeridos por Formato Oficial)
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

  // NUEVO: Folio de Liberación (Condicional)
  release_folio?: string;

  activities?: string;
  motivos: string;

  // Documentos (URLs)
  // doc_request y doc_motivos ahora son opcionales porque se generan automáticamente
  doc_request?: string;
  doc_motivos?: string;

  doc_address?: string;
  doc_income?: string;
  doc_ine?: string;
  doc_school_id?: string;

  // ACTUALIZADO: Cambiamos doc_schedule por doc_kardex para ser consistentes con la solicitud
  doc_kardex?: string;

  doc_extra?: string;

  // Control
  status: ApplicationStatus;
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