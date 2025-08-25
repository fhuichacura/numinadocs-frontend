import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [briefingData, setBriefingData] = useState({ loading: true, data: [], error: null });

  const fetchBriefingForSession = useCallback(async (authToken) => {
    if (!authToken) return;
    setBriefingData(prev => ({ ...prev, loading: true }));
    try {
      const response = await apiClient.get('/briefing/', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setBriefingData({ loading: false, data: response.data, error: null });
    } catch (error) {
      console.error("AuthContext: Error al cargar el informe de inteligencia:", error);
      setBriefingData({ loading: false, data: [], error: error });
    }
  }, []);

  useEffect(() => {
    const loadUserAndData = async () => {
      if (token) {
        try {
          const userResponse = await apiClient.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(userResponse.data);
          // Inicia la carga del informe sin bloquear el renderizado
          fetchBriefingForSession(token);
        } catch (error) {
          console.error("Token inválido, cerrando sesión.", error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadUserAndData();
  }, [token, fetchBriefingForSession]);

  const login = async (email, password) => {
    const params = new URLSearchParams({ username: email, password });
    
    // --- INICIO DE LA CORRECCIÓN CLAVE ---
    // La petición POST ahora incluye la cabecera 'Content-Type' que el backend necesita.
    const response = await apiClient.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    // --- FIN DE LA CORRECCIÓN CLAVE ---

    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };
  
  const refreshUser = useCallback(async () => {
    if (token) {
      try {
        const userResponse = await apiClient.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userResponse.data);
      } catch (error) {
        console.error("No se pudo refrescar el usuario, cerrando sesión.", error);
        logout();
      }
    }
  }, [token]);

  const value = { token, user, loading, login, logout, refreshUser, briefingData, fetchBriefingForSession };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};