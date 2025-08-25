import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';

const IntelligenceArchiveView = () => {
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchArchive = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await apiClient.get('/briefing/archive/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setArchive(response.data);
      } catch (error) {
        console.error("Error al cargar el archivo de inteligencia:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArchive();
  }, [token]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Archivo de Inteligencia</h1>
      <div className="bg-gray-800 p-6 rounded-lg">
        {loading ? (
          <p className="text-gray-400">Cargando archivo...</p>
        ) : archive.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {archive.map(item => (
              <li key={item.id} className="py-4">
                <Link to={`/briefing/${item.id}`} className="group">
                  <h3 className="text-lg font-semibold text-purple-400 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Guardado el: {new Date(item.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Tu archivo está vacío. Guarda informes desde su vista de detalle para que aparezcan aquí.
          </p>
        )}
      </div>
    </div>
  );
};

export default IntelligenceArchiveView;