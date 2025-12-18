// Ubicación: frontend/src/shared/types.ts

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  web?: string;
}

// 👇 ¡ESTA PALABRA 'export' ES LA CLAVE!
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

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;      // 'admin_sys' | 'estructura' | 'concejal' ...
  area?: string;     // Opcional
  career?: string;   // Opcional
  is_active: boolean;

  // --- CAMPOS NUEVOS ---
  imagen_url?: string;
  phone_number?: string;
  instagram_url?: string;
}

export type ScholarshipType = 'Alimenticia' | 'Reinscripción' | 'CLE (Idiomas)' | 'Otra';

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

export interface ScholarshipApplication {
  id: number;
  scholarship_id: number;
  scholarship_name?: string;

  // DATOS NUEVOS (Públicos)
  full_name: string;
  email: string;
  control_number: string;

  status: 'Pendiente' | 'En Revisión' | 'Aprobada' | 'Rechazada' | 'Documentación Faltante';
  created_at: string;
  admin_comments?: string;
}