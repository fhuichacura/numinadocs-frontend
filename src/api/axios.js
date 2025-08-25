// src/lib/apiClient.ts (o donde lo tengas)
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

/**
 * Determina el origen base de la API:
 * - Usa VITE_API_URL si existe (Amplify/entornos).
 * - Si no, cae al origin del navegador (útil cuando el frontend y backend comparten dominio).
 * - Último fallback: http://localhost:8006 (dev local).
 */
const RAW_API_ORIGIN =
  import.meta.env?.VITE_API_URL?.trim() ||
  (typeof window !== 'undefined' ? window.location.origin : '') ||
  'http://localhost:8006';

/** Normaliza y asegura el sufijo /api/v1 */
const normalize = (s: string) => s.replace(/\/+$/, '');
const BASE_URL = `${normalize(RAW_API_ORIGIN)}/api/v1`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000, // 20s por si hay cold starts
  withCredentials: false,
});

/** Adjunta Authorization si hay token en localStorage */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  // Traceo opcional por request
  (config.headers as Record<string, string>)['X-Requested-With'] = 'XMLHttpRequest';
  return config;
});

/**
 * Reintento simple para GET idempotentes ante errores de red/5xx (una vez).
 * Evita bucles en POST/PUT/DELETE.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const cfg = error.config as AxiosRequestConfig & { __retried?: boolean };
    const status = error.response?.status;

    // 401 → token inválido/expirado: limpia sesión y redirige a login
    if (status === 401) {
      try {
        localStorage.removeItem('token');
      } catch {}
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    }

    // 403 → sin permiso (opcional: redirigir o mostrar toast)
    if (status === 403) {
      return Promise.reject(error);
    }

    // Reintento simple para GET en 502/503/504 o errores de red
    const shouldRetry =
      !cfg?.__retried &&
      cfg?.method?.toLowerCase() === 'get' &&
      (!status || [502, 503, 504].includes(status));

    if (shouldRetry) {
      cfg.__retried = true;
      await new Promise((r) => setTimeout(r, 600)); // pequeño backoff
      return apiClient(cfg);
    }

    return Promise.reject(error);
  }
);

/** Helpers opcionales para gestionar el token de manera explícita */
export const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
};

export const getBaseUrl = () => BASE_URL;

export default apiClient;
