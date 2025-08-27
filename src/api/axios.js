// src/api/axios.js
import axios from 'axios';

function getApiOrigin() {
  try {
    if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
      return String(import.meta.env.VITE_API_URL);
    }
  } catch (e) {}
  try {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
  } catch (e) {}
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
    var st = err && err.response ? err.response.status : undefined;
    var cfg = err ? err.config : undefined;

    if (st === 401) {
      try { localStorage.removeItem('token'); } catch {}
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(err);
    }
    var isGet = cfg && cfg.method ? String(cfg.method).toLowerCase()==='get' : false;
    var retry = isGet && !cfg.__retried && (!st || st===502 || st===503 || st===504);
    if (retry) { cfg.__retried = true; await new Promise(r=>setTimeout(r,600)); return api(cfg); }
    return Promise.reject(err);
  }
);

export const getBaseUrl = () => BASE_URL;
export default api;
