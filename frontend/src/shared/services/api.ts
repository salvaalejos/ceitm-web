import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL, ENDPOINTS } from '../config/constants';

import type {
  Scholarship,
  ScholarshipApplication,
  ScholarshipCreate,
  Complaint,
  Sanction,
  Shift,
  DayOfWeek,
  SanctionSeverity
} from "../types";

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
  let url = ENDPOINTS.NEWS.BASE;
  if (category && category !== 'TODAS') {
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
  const response = await api.post(ENDPOINTS.COMPLAINTS.BASE, data);
  return response.data;
};

export const getComplaints = async () => {
  const response = await api.get(ENDPOINTS.COMPLAINTS.BASE);
  return response.data;
};

export const trackComplaint = async (folio: string) => {
  const response = await api.get<Complaint>(`/quejas/track/${folio}`);
  return response.data;
};
export const getComplaintByFolio = trackComplaint;

export const resolveComplaint = async (id: number, data: FormData) => {
  const response = await api.put(`/quejas/${id}/resolve`, data);
  return response.data;
};

export const updateComplaintStatus = async (id: number, status: string) => {
  const response = await api.patch(ENDPOINTS.COMPLAINTS.BY_ID(id), { status });
  return response.data;
};

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

export const downloadExpediente = async (applicationId: number, controlNumber: string) => {
    try {
        const response = await api.get(`/becas/applications/${applicationId}/download`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Expediente_${controlNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
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


// ==========================================
// 🚀 NUEVO: MÓDULO CONTRALORÍA (Fase 2)
// ==========================================

// --- GUARDIAS (SHIFTS) ---
export const getShifts = async () => {
  // Conectamos con el endpoint /api/v1/shifts/
  const response = await api.get<Shift[]>('/shifts/');
  return response.data;
};

export const createShift = async (data: { user_id: number; day: DayOfWeek; hour: number }) => {
  const response = await api.post<Shift>('/shifts/', data);
  return response.data;
};

export const deleteShift = async (id: number) => {
  const response = await api.delete(`/shifts/${id}`);
  return response.data;
};

// --- SANCIONES ---
export const getSanctions = async () => {
  // Conectamos con el endpoint /api/v1/sanctions/
  const response = await api.get<Sanction[]>('/sanctions/');
  return response.data;
};

export const createSanction = async (data: {
  user_id: number;
  severity: SanctionSeverity;
  reason: string;
  penalty_description: string
}) => {
  const response = await api.post<Sanction>('/sanctions/', data);
  return response.data;
};

export const updateSanction = async (id: number, data: Partial<Sanction>) => {
  const response = await api.put<Sanction>(`/sanctions/${id}`, data);
  return response.data;
};

export const deleteSanction = async (id: number) => {
  const response = await api.delete(`/sanctions/${id}`);
  return response.data;
};


// ==========================================
// 🚀 NUEVO: MÓDULO AUDITORÍA (Base de Datos)
// ==========================================
export const getAuditLogs = async (module?: string) => {
  const params = module ? { module } : {};
  const response = await api.get(ENDPOINTS.AUDIT.BASE, { params });
  return response.data;
};

export const downloadDbBackup = async () => {
    try {
        const response = await api.get('/audit/dump', { responseType: 'blob' });

        // Generar nombre con fecha: backup_2025-02-14.sql
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `backup_${dateStr}.sql`;

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error descargando respaldo:", error);
        throw error;
    }
};


// --- MAPA & UTILIDADES ---
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

export const getStudents = async () => {
  const response = await api.get('/becas/students'); // Endpoint que maneja el modelo Student
  return response.data;
};

export const updateStudentStatus = async (controlNumber: string, data: any) => {
  const response = await api.patch(`/becas/students/${controlNumber}`, data);
  return response.data;
};