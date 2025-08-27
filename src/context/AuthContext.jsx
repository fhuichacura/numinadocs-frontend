// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Carga inicial
  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      if (t) {
        setToken(t);
        // decode básico del sub (si ocupa)
        const payload = JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        setUser(payload?.sub ? { email: payload.sub } : null);
      }
    } catch {}
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const body = new URLSearchParams({ username: email, password });
    const { data } = await api.post('/auth/login', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 20000,
    });
    const t = data?.access_token;
    if (!t) throw new Error('Token no recibido');
    localStorage.setItem('token', t);
    setToken(t);
    try {
      const payload = JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      setUser(payload?.sub ? { email: payload.sub } : null);
    } catch { setUser(null); }
    return data;
  };

  const logout = () => {
    try { localStorage.removeItem('token'); } catch {}
    setUser(null); setToken(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  const value = useMemo(() => ({ token, user, login, logout, loading }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
