// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('felipe@numinadocs.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { state } = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await login(email, password);
      const to = state?.from?.pathname || '/dashboard';
      navigate(to, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      setError(status === 401 ? 'Email o contraseña incorrectos.' : 'No fue posible iniciar sesión.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">NuminaDocs</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400">Email</label>
            <input className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                   type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400">Contraseña</label>
            <input className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                   type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" className="w-full py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
