import axios from 'axios';
import { useAuthStore } from '../store/authStore';
// 👇 Importamos las constantes
import { API_BASE_URL, ENDPOINTS } from '../config/constants';

import type {
  Scholarship,
  ScholarshipApplication,
  ScholarshipCreate,
  Complaint,
  ComplaintStatus,
  Building
} from "../types";

// 👇 Usamos la URL dinámica
export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- USUARIOS & AUTH ---
export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  const response = await api.post(ENDPOINTS.AUTH.LOGIN, formData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get(ENDPOINTS.AUTH.ME);
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await api.put(ENDPOINTS.AUTH.ME, data);
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get(ENDPOINTS.USERS.BASE);
  return response.data;
};

export const createUser = async (userData: any) => {
  const response = await api.post(ENDPOINTS.USERS.BASE, userData);
  return response.data;
};

export const updateUser = async (id: number, userData: any) => {
  const response = await api.put(ENDPOINTS.USERS.BY_ID(id), userData);
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await api.delete(ENDPOINTS.USERS.BY_ID(id));
  return response.data;
};

export const getCareers = async () => {
  // Usamos la ruta directa para no obligarte a editar constants.ts ahorita
  const response = await api.get('/carreras/');
  return response.data;
};

export const updateCareer = async (id: number, data: any) => {
  const response = await api.patch(`/carreras/${id}`, data);
  return response.data;
};

export const getPublicConcejales = async () => {
  const response = await api.get(ENDPOINTS.USERS.CONCEJALES);
  return response.data;
};
// Alias para mantener compatibilidad si lo usas con otro nombre
export const getConcejalesPublic = getPublicConcejales;


// --- CONVENIOS ---
export const getConvenios = async () => {
  const response = await api.get(ENDPOINTS.CONVENIOS.BASE);
  return response.data;
};

export const createConvenio = async (convenioData: any) => {
  const response = await api.post(ENDPOINTS.CONVENIOS.BASE, convenioData);
  return response.data;
};

export const updateConvenio = async (id: number, convenioData: any) => {
    const response = await api.put(ENDPOINTS.CONVENIOS.BY_ID(id), convenioData);
    return response.data;
};

export const deleteConvenio = async (id: number) => {
  const response = await api.delete(ENDPOINTS.CONVENIOS.BY_ID(id));
  return response.data;
};


// --- NOTICIAS ---
export const getNews = async (category?: string) => {
  // Construimos la URL con el parámetro si existe
  let url = ENDPOINTS.NEWS.BASE;
  if (category && category !== 'TODAS') { // 'TODAS' es un valor de control del frontend
      url += `?category=${category}`;
  }

  const response = await api.get(url);
  return response.data;
};

export const getSingleNews = async (slug: string) => {
  const response = await api.get(ENDPOINTS.NEWS.BY_SLUG(slug));
  return response.data;
};

export const createNews = async (newsData: any) => {
  const response = await api.post(ENDPOINTS.NEWS.BASE, newsData);
  return response.data;
};

export const updateNews = async (id: number, newsData: any) => {
  const response = await api.put(ENDPOINTS.NEWS.BY_ID(id), newsData);
  return response.data;
};

export const deleteNews = async (id: number) => {
  const response = await api.delete(ENDPOINTS.NEWS.BY_ID(id));
  return response.data;
};


// --- DOCUMENTOS ---
export const getPublicDocuments = async (category?: string) => {
  let url = ENDPOINTS.DOCUMENTS.PUBLIC;
  if (category) url += `?category=${category}`;
  const response = await api.get(url);
  return response.data;
};

export const getAllDocuments = async () => {
  const response = await api.get(ENDPOINTS.DOCUMENTS.ADMIN);
  return response.data;
};

export const createDocument = async (docData: any) => {
  const response = await api.post(ENDPOINTS.DOCUMENTS.BASE, docData);
  return response.data;
};

export const deleteDocument = async (id: number) => {
  const response = await api.delete(ENDPOINTS.DOCUMENTS.BY_ID(id));
  return response.data;
};


// --- QUEJAS (BUZÓN) ---
export const createComplaint = async (data: FormData) => {
  // Al pasar FormData, el Content-Type se ajusta solo a multipart/form-data
  const response = await api.post(ENDPOINTS.COMPLAINTS.BASE, data);
  return response.data;
};

export const getComplaints = async () => {
  const response = await api.get(ENDPOINTS.COMPLAINTS.BASE);
  return response.data;
};

// NUEVO: Rastreo público por folio
export const trackComplaint = async (folio: string) => {
  // NOTA: Asegúrate de que ENDPOINTS.COMPLAINTS.BASE sea '/quejas'
  // O ajusta aquí directamente: `/quejas/track/${folio}`
  const response = await api.get<Complaint>(`/quejas/track/${folio}`);
  return response.data;
};
// Alias para mantener compatibilidad con el código que te pasé antes
export const getComplaintByFolio = trackComplaint;

// NUEVO: Resolver Ticket (Admin)
export const resolveComplaint = async (id: number, data: FormData) => {
  // Axios detectará automáticamente que es FormData y pondrá los headers correctos
  const response = await api.put(`/quejas/${id}/resolve`, data);
  return response.data;
};

// Deprecado pero mantenido por compatibilidad (usa resolveComplaint preferiblemente)
export const updateComplaintStatus = async (id: number, status: string) => {
  const response = await api.patch(ENDPOINTS.COMPLAINTS.BY_ID(id), { status });
  return response.data;
};

// NUEVO: Eliminar Queja
export const deleteComplaint = async (id: number) => {
  await api.delete(`/quejas/${id}`);
};

// --- BECAS ---
export const getScholarships = async (activeOnly: boolean = true) => {
  const response = await api.get<Scholarship[]>(`${ENDPOINTS.SCHOLARSHIPS.BASE}?active_only=${activeOnly}`);
  return response.data;
};

export const submitScholarshipApplication = async (data: any) => {
  const response = await api.post(ENDPOINTS.SCHOLARSHIPS.APPLY, data);
  return response.data;
};

export const createScholarship = async (data: ScholarshipCreate) => {
  const response = await api.post(ENDPOINTS.SCHOLARSHIPS.BASE, data);
  return response.data;
};

export const getApplications = async (scholarshipId: number) => {
  const response = await api.get<ScholarshipApplication[]>(ENDPOINTS.SCHOLARSHIPS.APPLICATIONS, {
    params: { scholarship_id: scholarshipId }
  });
  return response.data;
};

export const updateScholarship = async (id: number, data: any) => {
  const response = await api.patch<Scholarship>(ENDPOINTS.SCHOLARSHIPS.BY_ID(id), data);
  return response.data;
};

export const updateApplicationStatus = async (id: number, data: any) => {
  const response = await api.patch<ScholarshipApplication>(ENDPOINTS.SCHOLARSHIPS.APPLICATION_STATUS(id), data);
  return response.data;
};

export const checkMyStatus = async (controlNumber: string) => {
  const response = await api.get<ScholarshipApplication[]>(ENDPOINTS.SCHOLARSHIPS.CHECK_STATUS(controlNumber));
  return response.data;
};


// --- UTILIDADES (ARCHIVOS) ---
export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(ENDPOINTS.UTILS.UPLOAD_IMAGE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.url;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(ENDPOINTS.UTILS.UPLOAD_FILE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};


// --- AUDITORÍA ---
export const getAuditLogs = async (module?: string) => {
  const params = module ? { module } : {};
  const response = await api.get(ENDPOINTS.AUDIT.BASE, { params });
  return response.data;
};

export const downloadExpediente = async (applicationId: number, controlNumber: string) => {
    try {
        const response = await api.get(`/becas/applications/${applicationId}/download`, {
            responseType: 'blob' // Importante: Le dice a Axios que esperamos un archivo
        });

        // Crear una URL temporal para el archivo descargado
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Nombre del archivo que se guardará
        link.setAttribute('download', `Expediente_${controlNumber}.pdf`);

        // Click automático
        document.body.appendChild(link);
        link.click();

        // Limpieza
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error descargando expediente:", error);
        throw error;
    }
};

// --- GESTIÓN DE CUPOS (QUOTAS) ---
export const getQuotas = async (scholarshipId: number) => {
    const response = await api.get(`/becas/${scholarshipId}/quotas`);
    return response.data;
};

export const initQuotas = async (scholarshipId: number) => {
    const response = await api.post(`/becas/${scholarshipId}/quotas/init`);
    return response.data;
};

export const updateQuota = async (quotaId: number, totalSlots: number) => {
    const response = await api.patch(`/becas/quotas/${quotaId}`, { total_slots: totalSlots });
    return response.data;
};

// --- MAPA (PONYMAP) ---

// --- MAPA (PONYMAP) ---
export const getBuildings = async () => {
  const response = await api.get('/map/buildings');
  return response.data;
};

export const searchMap = async (query: string) => {
  const response = await api.get('/map/buildings/search', { params: { q: query } });
  return response.data;
};

export const getBuildingById = async (id: number) => {
  const response = await api.get(`/map/buildings/${id}`);
  return response.data;
};

// NUEVAS FUNCIONES ADMIN
export const createBuilding = async (data: any) => {
    const response = await api.post('/map/buildings', data);
    return response.data;
};

export const updateBuilding = async (id: number, data: any) => {
    const response = await api.put(`/map/buildings/${id}`, data);
    return response.data;
};

export const deleteBuilding = async (id: number) => {
    const response = await api.delete(`/map/buildings/${id}`);
    return response.data;
};

export const createRoom = async (data: any) => {
    const response = await api.post('/map/rooms', data);
    return response.data;
};

export const updateRoom = async (id: number, data: any) => {
    const response = await api.put(`/map/rooms/${id}`, data);
    return response.data;
};

export const deleteRoom = async (id: number) => {
    const response = await api.delete(`/map/rooms/${id}`);
    return response.data;
};