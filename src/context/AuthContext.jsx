// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carga inicial desde localStorage
  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      if (t) setToken(t);
    } catch {}
    setLoading(false);
  }, []);

  // Login contra /auth/login (form-urlencoded: username + password)
  const login = async (email, password) => {
    const body = new URLSearchParams({ username: email, password });
    const { data } = await api.post('/auth/login', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const t = data?.access_token;
    if (!t) throw new Error('Token no recibido');
    localStorage.setItem('token', t);
    setToken(t);
    return data;
  };

  const logout = () => {
    try { localStorage.removeItem('token'); } catch {}
    setToken(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  const value = useMemo(() => ({ token, login, logout, loading }), [token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
