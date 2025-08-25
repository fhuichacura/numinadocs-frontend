import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import MermaidChart from '../components/MermaidChart';
import AICompanionPanel from '../components/AICompanionPanel';
import Modal from 'react-modal';

const modalStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%',
    transform: 'translate(-50%, -50%)', background: '#1f2937', border: '1px solid #4b5563',
    borderRadius: '1rem', width: '90%', maxWidth: '500px'
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' }
};
Modal.setAppElement('#root');

const SaveAsTemplateForm = ({ documentId, closeModal }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await apiClient.post('/templates/from_document', 
                { document_id: documentId, name, description },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            closeModal();
            navigate(`/templates/${response.data.id}`);
        } catch (error) {
            console.error("Error al guardar como plantilla:", error);
            alert("No se pudo guardar la plantilla.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-white">
            <h3 className="text-xl font-semibold">Guardar como Plantilla Nueva</h3>
            <input type="text" placeholder="Nombre de la nueva plantilla" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 bg-gray-800 rounded-md" />
            <textarea placeholder="Descripción corta (opcional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 bg-gray-800 rounded-md h-24"></textarea>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold disabled:bg-gray-500">
                    {isSubmitting ? 'Guardando...' : 'Guardar Plantilla'}
                </button>
            </div>
        </form>
    );
};

const DocumentRenderer = ({ content, isEditing, onContentChange }) => {
  const sections = content?.sections || [];

  const handleSectionChange = (index, newText) => {
    const newSections = [...sections];
    newSections[index].text = newText;
    onContentChange({ sections: newSections });
  };

  return (
    <div className="prose prose-invert max-w-none text-gray-300">
      {sections.map((section, index) => {
        if (section.type === 'heading') {
          return isEditing ? (
            <input key={index} type="text" value={section.text} onChange={(e) => handleSectionChange(index, e.target.value)} className="w-full bg-gray-700 text-2xl font-bold text-white mt-6 mb-3 p-2 rounded-md" />
          ) : ( <h2 key={index} className="text-2xl font-bold text-white mt-6 mb-3">{section.text}</h2> );
        }
        if (section.type === 'paragraph') {
          return isEditing ? (
            <textarea key={index} value={section.text} onChange={(e) => handleSectionChange(index, e.target.value)} className="w-full bg-gray-700 mb-4 p-2 rounded-md h-auto text-gray-200" rows={Math.max(5, (section.text || '').split('\n').length)} />
          ) : ( <p key={index} className="mb-4 leading-relaxed whitespace-pre-wrap">{section.text}</p> );
        }
        if (section.type === 'mermaid') {
          return isEditing ? (
             <div key={index} className="my-4">
                <label className="text-sm text-gray-400">Código del Diagrama (Mermaid)</label>
                <textarea value={section.text} onChange={(e) => handleSectionChange(index, e.target.value)} className="w-full bg-gray-900 text-cyan-300 font-mono text-sm p-4 rounded-md h-48" />
             </div>
          ) : (
            <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 my-4 flex justify-center">
              <MermaidChart chart={section.text} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

const DocumentView = () => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  // --- INICIO DE LA CORRECCIÓN CLAVE ---
  // Inicializamos el estado con una estructura válida para evitar el error 'null'.
  const [editedContent, setEditedContent] = useState({ sections: [] });
  // --- FIN DE LA CORRECCIÓN CLAVE ---
  const [selectedText, setSelectedText] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { documentId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchDocument = async () => {
    if (!token || !documentId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/documents/${documentId}`, { headers: { Authorization: `Bearer ${token}` } });
      setDocument(response.data);
      setEditedTitle(response.data.title);
      // Nos aseguramos de que si content_full es nulo, usamos un objeto por defecto
      setEditedContent(response.data.content_full || { sections: [] });
    } catch (error) {
      console.error("Error al cargar el documento:", error);
      setDocument(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId, token]);
  
  const handleSave = async () => {
    try {
      setIsAILoading(true);
      const payload = { 
        title: editedTitle,
        content_full: editedContent 
      };
      await apiClient.put(`/documents/${documentId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setIsEditing(false);
      await fetchDocument();
    } catch (error) {
      console.error("Error al guardar el documento:", error);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSelection = () => {
    if (isEditing) setSelectedText(window.getSelection().toString());
  };

  const handleAIAction = async (action, textOverride = '') => {
    const textToProcess = textOverride || selectedText;
    if (!textToProcess) return;
    setIsAILoading(true);
    try {
      const payload = { action, text: textToProcess, context: JSON.stringify(editedContent) };
      const response = await apiClient.post('/ai-actions/', payload, { headers: { Authorization: `Bearer ${token}` } });
      const generatedText = response.data.generated_text;

      if (action === 'mermaid') {
        const newSection = { type: 'mermaid', text: generatedText };
        setEditedContent(prev => ({ ...prev, sections: [...(prev?.sections || []), newSection] }));
      } else {
        const currentContentStr = JSON.stringify(editedContent);
        const newContentStr = currentContentStr.replace(textToProcess, generatedText);
        setEditedContent(JSON.parse(newContentStr));
      }
      setSelectedText('');
    } catch (error) {
      console.error("Error en la acción de IA:", error);
      alert("La acción de IA ha fallado.");
    } finally {
      setIsAILoading(false);
    }
  };

  const handleRegenerate = async () => {
    setIsAILoading(true);
    try {
        await apiClient.post(`/documents/${documentId}/regenerate`, {}, { headers: { Authorization: `Bearer ${token}` } });
        await fetchDocument();
    } catch (error) {
        console.error("Error al regenerar el documento:", error);
        alert("La regeneración falló. Por favor, inténtalo de nuevo.");
    } finally {
        setIsAILoading(false);
    }
  };

  if (loading) return <p className="text-gray-400 text-center py-10">Cargando documento...</p>;
  
  if (!document) {
    return (
      <div className="text-center p-8 bg-gray-800 rounded-lg">
        <h1 className="text-2xl font-bold text-red-400">Error al Cargar el Documento</h1>
        <p className="text-gray-400 mt-4">No se pudo encontrar o cargar el contenido del documento.</p>
        <Link to="/dashboard" className="mt-6 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">
            &larr; Volver al Dashboard
        </Link>
      </div>
    );
  }
  
  const isErrorState = document.content_full?.sections?.[0]?.text.startsWith("Error al Generar Documento");

  return (
    <>
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 h-full ${isAILoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="lg:col-span-2 bg-gray-800 p-8 rounded-lg">
          <div className="flex justify-between items-center mb-8">
            {isEditing ? (
              <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="text-4xl font-bold text-white bg-gray-700 p-2 rounded-md w-2/3" />
            ) : ( <h1 className="text-4xl font-bold text-white">{document.title}</h1> )}
            
            <div className="flex items-center gap-4">
              <button onClick={() => setModalIsOpen(true)} title="Guardar como Plantilla" className="p-2 bg-gray-700 hover:bg-purple-600 rounded-md text-gray-300 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm3 0a1 1 0 00-1 1v1a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1H8z" /></svg>
              </button>
              
              {!isErrorState && (
                isEditing ? (
                  <div className="flex gap-4">
                    <button onClick={() => { setIsEditing(false); setEditedContent(document.content_full); setEditedTitle(document.title); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">Guardar Cambios</button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">Editar</button>
                )
              )}
            </div>
          </div>
          
          {isErrorState ? (
              <div className='bg-gray-900/50 p-6 rounded-lg'>
                  <h2 className='text-xl font-bold text-red-400 mb-2'>Error al Generar Documento</h2>
                  <p className='text-gray-400 mb-6'>La IA no pudo procesar la solicitud. Puedes revisar tus apuntes e intentarlo de nuevo.</p>
                  <div className='border-t border-gray-700 pt-4'>
                      <p className='text-sm text-gray-500 mb-2'>Notas originales:</p>
                      <p className='text-gray-300 whitespace-pre-wrap bg-gray-800 p-2 rounded-md'>{document.content_summary}</p>
                  </div>
                  <button onClick={handleRegenerate} className="mt-6 w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">
                      {isAILoading ? "Regenerando..." : "Volver a Generar con IA"}
                  </button>
              </div>
          ) : (
              <DocumentRenderer 
                  content={editedContent} 
                  isEditing={isEditing}
                  onContentChange={setEditedContent}
              />
          )}
        </div>
        <div className="lg:col-span-1">
          <AICompanionPanel selectedText={selectedText} onAction={handleAIAction} />
        </div>
      </div>

      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} style={modalStyles}>
          <SaveAsTemplateForm documentId={documentId} closeModal={() => setModalIsOpen(false)} />
      </Modal>
    </>
  );
};

export default DocumentView;