import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const IntelligenceBriefingWidget = () => {
  const { briefingData, fetchBriefingForSession, token } = useAuth();
  const { loading, data: briefings, error } = briefingData;

  const getSummaryPoints = (summary) => {
    if (!summary) return ["No hay resumen disponible."];
    if (summary.points && Array.isArray(summary.points)) return summary.points;
    return ["Formato de resumen no reconocido."];
  };

  const handleRefresh = () => {
    if (token) {
      fetchBriefingForSession(token);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <p className="text-gray-400 text-center py-4">Analizando fuentes...</p>;
    }
    if (error) {
      return <p className="text-red-400 text-center py-4">No se pudo cargar el informe.</p>;
    }
    if (briefings && briefings.length > 0) {
      return (
        <ul className="space-y-4">
          {briefings.map(item => {
            const summaryPoints = getSummaryPoints(item.summary);
            return (
              <li key={item.id}>
                <Link to={`/briefing/${item.id}`} className="block border-l-4 border-transparent hover:border-purple-500 pl-4 group transition-colors duration-200">
                  <div className="font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">{item.title}</div>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                    {summaryPoints.join(' ')}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      );
    }
    return <p className="text-gray-500 text-center py-4">No hay informes disponibles. Revisa tu configuración de IA o refresca.</p>;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-white">Informe de Inteligencia</h2>
        <button onClick={handleRefresh} className="text-sm text-purple-400 hover:text-white p-1 rounded-full hover:bg-gray-700" title="Refrescar ahora" disabled={loading}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 2.566 1 1 0 11-1.898.632A5.002 5.002 0 005.898 6.101V4a1 1 0 112 0v4a1 1 0 01-1 1H3a1 1 0 110-2h2.101A7.002 7.002 0 014 2z" clipRule="evenodd" /></svg>
        </button>
      </div>
      
      {/* --- CORRECCIÓN DE ALTURA Y SCROLL --- */}
      <div className="overflow-y-auto pr-2 max-h-80"> {/* max-h-80 es aprox 320px */}
        {renderContent()}
      </div>
    </div>
  );
};

export default IntelligenceBriefingWidget;