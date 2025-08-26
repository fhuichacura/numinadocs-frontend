// src/api/axios.js
import axios from 'axios';

// Origen base de la API: Vite -> VITE_API_URL; si no, origin; si no, localhost
const rawApiOrigin =
  (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof window !== 'undefined' ? window.location.origin : '') ||
  'https://api-nd.n100f.com';

// Normaliza y asegura /api/v1
const normalize = (s) => (s ? s.replace(/\/+$/, '') : '');
const BASE_URL = `${normalize(rawApiOrigin)}/api/v1`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
  withCredentials: false,
});

// Adjunta Authorization si hay token
apiClient.interceptors.request.use((config) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }
    config.headers = { ...(config.headers || {}), 'X-Requested-With': 'XMLHttpRequest' };
  } catch {}
  return config;
});

// Manejo 401 + reintento simple GET en 502/503/504
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const cfg = error?.config;

    if (status === 401) {
      try { localStorage.removeItem('token'); } catch {}
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    }

    const isGet = cfg?.method?.toLowerCase() === 'get';
    const retriable = isGet && !cfg.__retried && (!status || [502, 503, 504].includes(status));
    if (retriable) {
      cfg.__retried = true;
      await new Promise((r) => setTimeout(r, 600));
      return apiClient(cfg);
    }
    return Promise.reject(error);
  }
);

export const getBaseUrl = () => BASE_URL;
export default apiClient;
