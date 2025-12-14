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