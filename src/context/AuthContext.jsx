// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { parseJwt } from '../utils/jwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    try {
      var t = localStorage.getItem('token');
      if (t) {
        setToken(t);
        var decoded = parseJwt(t);
        setUser(decoded ? { email: decoded.sub } : null);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  // /auth/login espera x-www-form-urlencoded: username + password
  const login = async function (email, password) {
    var body = new URLSearchParams({ username: email, password: password });
    var res  = await api.post('/auth/login', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    var t = res && res.data ? res.data.access_token : null;
    if (!t) throw new Error('Token no recibido');
    localStorage.setItem('token', t);
    setToken(t);
    var decoded = parseJwt(t);
    setUser(decoded ? { email: decoded.sub } : null);
    return res.data;
  };

  const logout = function () {
    try { localStorage.removeItem('token'); } catch (e) {}
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  const value = useMemo(function () {
    return { token: token, user: user, login: login, logout: logout, loading: loading };
  }, [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
