import axios from 'axios';
import { useAuthStore } from '../store/authStore';
// Importamos solo los TIPOS con 'import type' para evitar errores de compilación
import type {
  Scholarship,
  ScholarshipApplication,
  ScholarshipUpdate,
  ScholarshipCreate,
  ApplicationUpdate
} from "../types";

const API_URL = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- SERVICIOS EXISTENTES (CONVENIOS, USUARIOS, NOTICIAS...) ---
// (Mantenemos tus funciones base para no romper nada más)

export const getConvenios = async () => {
  const response = await api.get('/convenios/');
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get('/users/');
  return response.data;
};

export const getPublicConcejales = async () => {
  const response = await api.get('/users/concejales');
  return response.data;
};

export const createUser = async (userData: any) => {
  const response = await api.post('/users/', userData);
  return response.data;
};

export const updateUser = async (id: number, userData: any) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  const response = await api.post('/login/access-token', formData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/utils/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.url;
};

export const createConvenio = async (convenioData: any) => {
  const response = await api.post('/convenios/', convenioData);
  return response.data;
};

export const deleteConvenio = async (id: number) => {
  const response = await api.delete(`/convenios/${id}`);
  return response.data;
};

export const updateConvenio = async (id: number, convenioData: any) => {
    const response = await api.put(`/convenios/${id}`, convenioData);
    return response.data;
};

export const getNews = async () => {
  const response = await api.get('/noticias/');
  return response.data;
};

export const getSingleNews = async (slug: string) => {
  const response = await api.get(`/noticias/${slug}`);
  return response.data;
};

export const createNews = async (newsData: any) => {
  const response = await api.post('/noticias/', newsData);
  return response.data;
};

export const updateNews = async (id: number, newsData: any) => {
  const response = await api.put(`/noticias/${id}`, newsData);
  return response.data;
};

export const deleteNews = async (id: number) => {
  const response = await api.delete(`/noticias/${id}`);
  return response.data;
};

export const getPublicDocuments = async (category?: string) => {
  let url = '/documentos/';
  if (category) url += `?category=${category}`;
  const response = await api.get(url);
  return response.data;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/utils/upload/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAllDocuments = async () => {
  const response = await api.get('/documentos/admin');
  return response.data;
};

export const createDocument = async (docData: any) => {
  const response = await api.post('/documentos/', docData);
  return response.data;
};

export const deleteDocument = async (id: number) => {
  const response = await api.delete(`/documentos/${id}`);
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await api.put('/users/me', data);
  return response.data;
};

export const getConcejalesPublic = async () => {
  const response = await api.get('/users/concejales');
  return response.data;
};

export const createComplaint = async (data: any) => {
  const response = await api.post('/quejas/', data);
  return response.data;
};

export const getComplaints = async () => {
  const response = await api.get('/quejas/');
  return response.data;
};

export const updateComplaintStatus = async (id: number, status: string) => {
  const response = await api.patch(`/quejas/${id}`, { status });
  return response.data;
};


// --- BECAS (becas) ---
// Aquí están las funciones que tu frontend público YA está buscando:

// 1. Obtener todas (Público) - Restaurada
export const getScholarships = async (activeOnly: boolean = true) => {
  // Nota: ajusté el endpoint para aceptar el parámetro, pero por default true como antes
  const response = await api.get<Scholarship[]>(`/becas/?active_only=${activeOnly}`);
  return response.data;
};

// 2. Enviar solicitud (Público) - Restaurada
export const submitScholarshipApplication = async (data: any) => {
  const response = await api.post('/becas/apply', data);
  return response.data;
};

// 3. Crear convocatoria (Admin) - Restaurada
export const createScholarship = async (data: ScholarshipCreate) => {
  const response = await api.post('/becas/', data);
  return response.data;
};

// 4. Ver solicitudes (Admin/Concejal) - Restaurada y tipada
export const getApplications = async (scholarshipId: number) => {
  // OJO: El backend lo definimos en /becas/applications
  const response = await api.get<ScholarshipApplication[]>('/becas/applications', {
    params: { scholarship_id: scholarshipId }
  });
  return response.data;
};

// --- NUEVAS FUNCIONES PARA EDICIÓN (ADMIN) ---

// Actualizar convocatoria (Activar/Cerrar/Editar)
export const updateScholarship = async (id: number, data: any) => {
  const response = await api.patch<Scholarship>(`/becas/${id}`, data);
  return response.data;
};

// Actualizar estatus de solicitud (Aprobar/Rechazar)
export const updateApplicationStatus = async (id: number, data: any) => {
  const response = await api.patch<ScholarshipApplication>(`/becas/applications/${id}`, data);
  return response.data;
};

// Consultar resultados (Público)
export const checkMyStatus = async (controlNumber: string) => {
  const response = await api.get<ScholarshipApplication[]>(`/becas/status/${controlNumber}`);
  return response.data;
};

export const getAuditLogs = async (module?: string) => {
  // Si enviamos un módulo (ej. "BECAS"), filtramos. Si no, trae todo.
  const params = module ? { module } : {};
  const response = await api.get('/audit/', { params });
  return response.data;
};