import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import Modal from 'react-modal';

// Estilos del Modal
const modalStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    background: '#1f2937', border: '1px solid #4b5563',
    borderRadius: '1rem', width: '90%', maxWidth: '700px',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};
Modal.setAppElement('#root');

// Formulario para Crear una Nueva Versión (Editor Visual)
const CreateVersionForm = ({ templateId, onVersionCreated, closeModal }) => {
    const [versionNumber, setVersionNumber] = useState('1.0');
    const [sections, setSections] = useState([
        { type: 'heading', text: '' },
        { type: 'paragraph', text: '' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token } = useAuth();

    const handleSectionChange = (index, field, value) => {
        const newSections = [...sections];
        newSections[index][field] = value;
        setSections(newSections);
    };

    const addSection = () => {
        setSections([...sections, { type: 'paragraph', text: '' }]);
    };

    const removeSection = (index) => {
        const newSections = sections.filter((_, i) => i !== index);
        setSections(newSections);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const payload = {
            version_number: versionNumber,
            content_structure: { sections: sections }
        };

        try {
            await apiClient.post(`/templates/${templateId}/versions`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onVersionCreated();
            closeModal();
        } catch (error) {
            console.error("Error al crear la versión:", error);
            alert("No se pudo crear la nueva versión.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
            <h2 className="text-2xl font-bold mb-4">Nueva Versión de Plantilla</h2>
            <input 
              type="text" 
              value={versionNumber} 
              onChange={e => setVersionNumber(e.target.value)} 
              placeholder="Número de Versión (ej: 1.0, 1.1)" 
              required 
              className="w-full p-2 bg-gray-800 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none" 
            />
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {sections.map((section, index) => (
                    <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <select 
                                value={section.type} 
                                onChange={(e) => handleSectionChange(index, 'type', e.target.value)}
                                className="p-1 bg-gray-700 rounded-md text-sm font-semibold"
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
                            className="w-full p-2 bg-gray-800 rounded-md h-24 resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        ></textarea>
                    </div>
                ))}
            </div>
            
            <button type="button" onClick={addSection} className="w-full text-sm font-semibold text-purple-400 hover:text-white py-2 rounded-md bg-gray-700 hover:bg-gray-600">
              + Añadir Sección
            </button>
            
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold disabled:bg-gray-500">
                  {isSubmitting ? 'Creando...' : 'Crear Versión'}
                </button>
            </div>
        </form>
    );
};

// --- Componente Principal ---
const TemplateDetailView = () => {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { templateId } = useParams();
  const { token } = useAuth();

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplate(response.data);
    } catch (error) {
      console.error("Error al cargar la plantilla", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTemplate();
    }
  }, [token, templateId]);

  if (loading) return <p className="text-gray-400">Cargando plantilla...</p>;
  if (!template) return <p className="text-red-500">No se pudo encontrar la plantilla.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/templates" className="text-sm text-purple-400 hover:text-white mb-2 block">&larr; Volver a la Biblioteca</Link>
          <h1 className="text-3xl font-bold text-white">{template.name}</h1>
          <p className="text-gray-400">{template.description}</p>
        </div>
        <button onClick={() => setModalIsOpen(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">
          ＋ Nueva Versión
        </button>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Versiones</h2>
        {template.versions && template.versions.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {template.versions.map(version => (
              <li key={version.id}>
                <Link 
                  to={`/templates/${template.id}/versions/${version.id}`}
                  className="py-3 flex justify-between items-center group hover:bg-gray-700/50 -mx-6 px-6 rounded-md transition-colors"
                >
                  <div>
                    <span className="font-semibold text-white group-hover:text-purple-400">{`Versión ${version.version_number}`}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${version.is_published ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {version.is_published ? 'Publicada' : 'Borrador'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No hay versiones para esta plantilla. ¡Crea la primera!</p>
        )}
      </div>

      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} style={modalStyles}>
        <CreateVersionForm 
          templateId={templateId} 
          onVersionCreated={fetchTemplate} 
          closeModal={() => setModalIsOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default TemplateDetailView;