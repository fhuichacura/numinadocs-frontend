import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import Modal from 'react-modal';

// Estilos del Modal
const modalStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%',
    transform: 'translate(-50%, -50%)', background: '#1f2937', border: '1px solid #4b5563',
    borderRadius: '1rem', width: '90%', maxWidth: '500px'
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' }
};
Modal.setAppElement('#root');

const CreateDocumentForm = ({ projectId, onDocumentCreated, closeModal }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!token) return;
      try {
        const response = await apiClient.get('/templates/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const activeTemplates = response.data.filter(t => t.versions && t.versions.length > 0);
        setTemplates(activeTemplates);
        if (activeTemplates.length > 0) {
          // Seleccionamos la primera versión de la primera plantilla por defecto
          setSelectedTemplateId(activeTemplates[0].versions[0].id);
        }
      } catch (error) {
        console.error("Error al cargar plantillas", error);
      }
    };
    fetchTemplates();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId) {
        setError('Por favor, selecciona una plantilla.');
        return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const selectedTemplate = templates.find(t => t.versions.some(v => v.id === selectedTemplateId));
      const docType = selectedTemplate?.tags.includes('executive') ? 'executive' : 
                      selectedTemplate?.tags.includes('commercial') ? 'commercial' : 'technical';

      const payload = { 
        title, 
        content_summary: summary, 
        project_id: projectId,
        template_id: selectedTemplateId,
        document_type: docType
      };

      const response = await apiClient.post('/documents/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onDocumentCreated(response.data.id);
    } catch (err) {
      setError('No se pudo crear el documento.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 text-white">
      <h3 className="text-xl font-semibold">Generar Documento con IA</h3>
      <p className="text-sm text-gray-400">Elige una plantilla y escribe tus ideas o apuntes. La IA usará tus notas para generar un borrador completo del documento.</p>
      
      <input type="text" placeholder="Título del documento" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 bg-gray-800 rounded-md" />
      
      <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full p-2 bg-gray-800 rounded-md">
        {templates.map(template => (
          <optgroup key={template.id} label={template.name}>
            {template.versions.map(version => (
              <option key={version.id} value={version.id}>
                {template.name} (v{version.version_number})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      
      <textarea placeholder="Pega aquí tus apuntes, ideas o palabras clave..." value={summary} onChange={e => setSummary(e.target.value)} required className="w-full p-2 bg-gray-800 rounded-md h-32"></textarea>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancelar</button>
        <button type="submit" disabled={isSubmitting || templates.length === 0} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold disabled:bg-gray-500">
          {isSubmitting ? 'Generando con IA...' : 'Generar Documento'}
        </button>
      </div>
    </form>
  );
};

const ProjectView = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { projectId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    if (!token || !projectId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/documents/by_project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error("Error al cargar los documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token, projectId]);

  const handleDocumentCreated = (newDocumentId) => {
    setModalIsOpen(false);
    navigate(`/documents/${newDocumentId}`);
  };

  const handleDelete = async (documentId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este documento?")) {
        try {
            await apiClient.delete(`/documents/${documentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDocuments();
        } catch (error) {
            console.error("Error al eliminar el documento:", error);
            alert("No se pudo eliminar el documento.");
        }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Documentos del Proyecto</h1>
        <button onClick={() => setModalIsOpen(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">
          ＋ Nuevo Documento con IA
        </button>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg mt-6">
        {loading ? (
          <p className="text-gray-400">Cargando documentos...</p>
        ) : (
          <table className="w-full text-left text-gray-300">
            <thead>
              <tr className="border-b border-gray-700 text-sm text-gray-400">
                <th className="p-3">Título</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Versión</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documents.length > 0 ? (
                documents.map(doc => (
                  <tr key={doc.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700">
                    <td className="p-3 font-semibold">
                      <Link to={`/documents/${doc.id}`} className="text-purple-400 hover:text-purple-300">
                        {doc.title}
                      </Link>
                    </td>
                    <td className="p-3 capitalize">{doc.document_type}</td>
                    <td className="p-3">{doc.version}</td>
                    <td className="p-3 text-right">
                        <button 
                            onClick={() => handleDelete(doc.id)} 
                            className="text-gray-400 hover:text-red-400 font-semibold"
                        >
                            Eliminar
                        </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-3 text-center text-gray-500">
                    No hay documentos en este proyecto. ¡Crea el primero con la IA!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} style={modalStyles}>
        <CreateDocumentForm projectId={projectId} onDocumentCreated={handleDocumentCreated} closeModal={() => setModalIsOpen(false)} />
      </Modal>
    </div>
  );
};

export default ProjectView;