import axios from 'axios';

// URL base de tu backend (FastAPI)
const API_URL = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

// Función para obtener convenios
export const getConvenios = async () => {
  const response = await api.get('/convenios/');
  return response.data;
};