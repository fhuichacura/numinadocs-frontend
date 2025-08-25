// src/api/axios.js
import axios from 'axios';

// 1) Origen base (Vite -> VITE_API_URL; fallback origin; luego localhost)
const rawApiOrigin =
  (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof window !== 'undefined' ? window.location.origin : '') ||
  'https://api-nd.n100f.com';

// 2) Normaliza y asegura sufijo /api/v1
const normalize = (s) => (s ? s.replace(/\/+$/, '') : '');
const BASE_URL = `${normalize(rawApiOrigin)}/api/v1`;

// 3) Cliente axios
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
  withCredentials: false,
});

// 4) Interceptor de request: añade token si existe
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

// 5) Interceptor de response: 401 -> logout; reintento GET 502/503/504 (1 vez)
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error && error.response && error.response.status;
    const cfg = error && error.config;

    if (status === 401) {
      try { localStorage.removeItem('token'); } catch {}
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    }

    const isGet = cfg && cfg.method && cfg.method.toLowerCase() === 'get';
    const shouldRetry = isGet && !cfg.__retried && (!status || [502, 503, 504].includes(status));
    if (shouldRetry) {
      cfg.__retried = true;
      await new Promise((r) => setTimeout(r, 600));
      return apiClient(cfg);
    }

    return Promise.reject(error);
  }
);

export const getBaseUrl = () => BASE_URL;
export default apiClient;
