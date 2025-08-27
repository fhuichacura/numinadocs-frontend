// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}
           className="flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-pulse">Cargando…</div>
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />;
}
