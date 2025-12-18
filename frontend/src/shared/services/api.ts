import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token; // Lee el token recién guardado
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- SERVICIOS ---

export const getConvenios = async () => {
  const response = await api.get('/convenios/');
  return response.data;
};

// --- GESTIÓN DE USUARIOS (ADMIN) ---

export const getUsers = async () => {
  const response = await api.get('/users/'); // Endpoint privado
  return response.data;
};

export const getPublicConcejales = async () => {
  const response = await api.get('/users/concejales'); // Endpoint público
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

// Función de Login (Formato x-www-form-urlencoded)
export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username); // FastAPI espera 'username' aunque sea email
  formData.append('password', password);

  const response = await api.post('/login/access-token', formData);
  return response.data; // Retorna { access_token: "...", token_type: "bearer" }
};

// Obtener datos del usuario actual (Perfil)
export const getCurrentUser = async () => {
  const response = await api.get('/users/me'); // Asegúrate que esta ruta exista en tu backend (suele ser estándar)
  return response.data;
};

// --- GESTIÓN DE CONVENIOS (ADMIN) ---

// 1. Subir Imagen
export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/utils/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.url; // Retorna la URL string
};

// 2. Crear Convenio
// Usamos 'any' temporalmente para el objeto, idealmente sería una interfaz Omit<Convenio, 'id'>
export const createConvenio = async (convenioData: any) => {
  const response = await api.post('/convenios/', convenioData);
  return response.data;
};

// 3. Eliminar Convenio
export const deleteConvenio = async (id: number) => {
  const response = await api.delete(`/convenios/${id}`); // Necesitamos asegurarnos que el backend tenga DELETE
  return response.data;
};

// 4. Actualizar Convenio (Lo usaremos después)
export const updateConvenio = async (id: number, convenioData: any) => {
    const response = await api.put(`/convenios/${id}`, convenioData);
    return response.data;
};

// --- GESTIÓN DE NOTICIAS ---

// 1. Obtener lista (Pública)
export const getNews = async () => {
  const response = await api.get('/noticias/');
  return response.data;
};

// 2. Obtener una noticia (Por slug)
export const getSingleNews = async (slug: string) => {
  const response = await api.get(`/noticias/${slug}`);
  return response.data;
};

// 3. Crear Noticia (Admin)
export const createNews = async (newsData: any) => {
  const response = await api.post('/noticias/', newsData);
  return response.data;
};

// 4. Actualizar Noticia (Admin)
export const updateNews = async (id: number, newsData: any) => {
  const response = await api.put(`/noticias/${id}`, newsData);
  return response.data;
};

// 5. Eliminar Noticia (Admin)
export const deleteNews = async (id: number) => {
  const response = await api.delete(`/noticias/${id}`);
  return response.data;
};

// --- DOCUMENTOS ---

// Público (Solo ve lo publicado)
export const getPublicDocuments = async (category?: string) => {
  let url = '/documentos/';
  if (category) url += `?category=${category}`;
  const response = await api.get(url);
  return response.data;
};

// Sube archivos genéricos (PDFs, Docs)
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  // Nota la ruta diferente: /utils/upload/file
  const response = await api.post('/utils/upload/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Admin (Ve todo)
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
