import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';

const BriefingDetailView = () => {
  const [briefing, setBriefing] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const { briefingId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const debouncedNoteContent = useDebounce(noteContent, 1000); // 1 segundo de debounce

  const getSummaryPoints = (summary) => {
    if (!summary) return ["No hay resumen disponible."];
    if (summary.points && Array.isArray(summary.points)) return summary.points;
    return ["Formato de resumen no reconocido."];
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !briefingId) return;
      try {
        setLoading(true);
        const [briefingRes, noteRes] = await Promise.all([
          apiClient.get(`/briefing/${briefingId}`, { headers: { Authorization: `Bearer ${token}` } }),
          apiClient.get(`/briefing/${briefingId}/notes`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => err)
        ]);
        
        setBriefing(briefingRes.data);
        if (noteRes.status === 200) {
          setNoteContent(noteRes.data.content);
        }

      } catch (error) {
        console.error("Error al cargar los datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, briefingId]);

  useEffect(() => {
    const saveNote = async () => {
      if (debouncedNoteContent && briefing) {
        setSaveStatus('Guardando...');
        try {
          await apiClient.post(`/briefing/${briefingId}/notes`, 
            { content: debouncedNoteContent },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSaveStatus('Guardado');
        } catch (error) {
          console.error("Error al autoguardar la nota:", error);
          setSaveStatus('Error al guardar');
        }
      }
    };
    
    // Solo guardar si el contenido ha sido modificado
    if (briefing) { // Asegura que el briefing haya cargado antes de permitir guardar
        saveNote();
    }
  }, [debouncedNoteContent, token, briefingId, briefing]);

  const handleArchive = async () => {
    try {
      await apiClient.post(`/briefing/${briefingId}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/archive');
    } catch (error) {
      console.error("Error al archivar el informe:", error);
    }
  };

  const handleDiscard = async () => {
    if (window.confirm("¿Estás seguro de que quieres descartar este informe? Esta acción no se puede deshacer.")) {
      try {
        await apiClient.delete(`/briefing/${briefingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/dashboard');
      } catch (error) {
        console.error("Error al descartar el informe:", error);
      }
    }
  };

  if (loading) return <p className="text-gray-400">Cargando informe y anotaciones...</p>;
  if (!briefing) return <p className="text-red-500">No se pudo encontrar el informe.</p>;

  const summaryPoints = getSummaryPoints(briefing.summary);

  return (
    <div className="space-y-8">
      <div>
        <Link to="/dashboard" className="text-sm text-purple-400 hover:text-white mb-4 block">&larr; Volver al Dashboard</Link>
        <h1 className="text-4xl font-bold text-white">{briefing.title}</h1>
        <a href={briefing.original_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-gray-500 hover:text-purple-400 font-semibold">
          Ver fuente original en la web &rarr;
        </a>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Resumen Generado por IA</h2>
          <ul className="list-disc list-inside space-y-3 text-gray-300 leading-relaxed">
            {summaryPoints.map((point, i) => <li key={i}>{point}</li>)}
          </ul>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Tu Interpretación</h2>
            <span className="text-sm text-gray-500 italic">{saveStatus}</span>
          </div>
          <textarea
            placeholder="Añade aquí tus conclusiones, ideas o cómo esto aplica a tus proyectos... El guardado es automático."
            className="w-full flex-grow p-2 bg-gray-900 rounded-md text-white text-sm resize-none"
            value={noteContent}
            onChange={(e) => {
              setNoteContent(e.target.value);
              setSaveStatus('Escribiendo...');
            }}
          />
        </div>
      </div>

      {!briefing.is_archived && (
        <div className="bg-gray-800 p-4 rounded-lg mt-8 flex items-center justify-end gap-4 border-t-2 border-gray-700">
            <p className="text-sm text-gray-400 mr-auto">¿Quieres conservar este informe en tu archivo?</p>
            <button 
              onClick={handleDiscard}
              className="px-4 py-2 bg-gray-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
            >
              Descartar
            </button>
            <button 
              onClick={handleArchive}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold"
            >
              Guardar en Archivo
            </button>
        </div>
      )}
    </div>
  );
};

export default BriefingDetailView;