import axios from 'axios';

function getApiOrigin() {
  try { if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) return String(import.meta.env.VITE_API_URL); } catch {}
  try { if (typeof window !== 'undefined' && window.location && window.location.origin) return window.location.origin; } catch {}
  return 'http://localhost:8006';
}
function trimRightSlashes(s){ return s ? s.replace(/\/+$/, '') : ''; }

const BASE_URL = trimRightSlashes(getApiOrigin()) + '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
  withCredentials: false
});

api.interceptors.request.use(function (config) {
  try {
    var t = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
    if (t) config.headers = Object.assign({}, config.headers, { Authorization: 'Bearer ' + t });
  } catch {}
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    var st = err?.response?.status; var cfg = err?.config;
    if (st === 401) { try { localStorage.removeItem('token'); } catch {}; if (typeof window !== 'undefined') window.location.href = '/login'; return Promise.reject(err); }
    var isGet = cfg?.method?.toLowerCase() === 'get';
    var retry = isGet && !cfg.__retried && (!st || [502,503,504].includes(st));
    if (retry) { cfg.__retried = true; await new Promise(r=>setTimeout(r,600)); return api(cfg); }
    return Promise.reject(err);
  }
);

export const getBaseUrl = () => BASE_URL;
export default api;
