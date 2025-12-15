import axios from 'axios';

const API_URL = 'http://192.168.100.97:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para inyectar el token en cada petición automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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

// Función de Login (Formato x-www-form-urlencoded)
export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username); // FastAPI espera 'username' aunque sea email
  formData.append('password', password);

  const response = await api.post('/login/access-token', formData);
  return response.data; // Retorna { access_token: "...", token_type: "bearer" }
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