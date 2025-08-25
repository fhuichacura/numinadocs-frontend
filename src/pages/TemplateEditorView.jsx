import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';

const TemplateEditorView = () => {
  const { templateId, versionId } = useParams();
  const [version, setVersion] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/templates/versions/${versionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVersion(response.data);
        setSections(response.data.content_structure.sections || []);
      } catch (error) {
        console.error("Error al cargar la versión de la plantilla", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchVersion();
    }
  }, [token, versionId]);

  const handleSectionChange = (index, field, value) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const addSection = () => {
    setSections([...sections, { type: 'paragraph', text: '' }]);
  };

  const removeSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const payload = {
        content_structure: { sections }
      };
      await apiClient.put(`/templates/versions/${versionId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/templates/${templateId}`);
    } catch (error) {
      console.error("Error al guardar los cambios", error);
      alert("No se pudieron guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <p className="text-gray-400">Cargando editor...</p>;
  if (!version) return <p className="text-red-500">No se pudo encontrar la versión de la plantilla.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to={`/templates/${templateId}`} className="text-sm text-purple-400 hover:text-white mb-2 block">&larr; Volver a las Versiones</Link>
          <h1 className="text-3xl font-bold text-white">Editando Versión {version.version_number}</h1>
        </div>
        <button onClick={handleSaveChanges} disabled={isSaving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold disabled:bg-gray-500">
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <select 
                    value={section.type} 
                    onChange={(e) => handleSectionChange(index, 'type', e.target.value)}
                    className="p-1 bg-gray-700 rounded-md text-sm font-semibold text-white" // <-- Estilo mejorado
                >
                    <option value="heading">Título</option>
                    <option value="paragraph">Párrafo</option>
                    <option value="mermaid">Diagrama</option>
                </select>
                <button type="button" onClick={() => removeSection(index)} className="text-red-400 hover:text-red-300 text-xs">Eliminar</button>
              </div>
              <textarea 
                  value={section.text}
                  onChange={(e) => handleSectionChange(index, 'text', e.target.value)}
                  placeholder={`Escribe el contenido para tu ${section.type}...`}
                  required
                  // --- INICIO DE LA CORRECCIÓN DE ESTILO ---
                  className="w-full p-2 bg-gray-800 rounded-md h-24 resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-200"
                  // --- FIN DE LA CORRECCIÓN DE ESTILO ---
              ></textarea>
            </div>
          ))}
        </div>
        <button type="button" onClick={addSection} className="w-full text-sm font-semibold text-purple-400 hover:text-white py-2 mt-4 rounded-md bg-gray-700 hover:bg-gray-600">
          + Añadir Sección
        </button>
      </div>
    </div>
  );
};

export default TemplateEditorView;