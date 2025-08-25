import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import Modal from 'react-modal';
import { Link } from 'react-router-dom'; // Importa Link

// Estilos del Modal
const modalStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    background: '#1a202c', border: '1px solid #4a5568',
    borderRadius: '1rem', width: '90%', maxWidth: '500px',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};
Modal.setAppElement('#root');

const CreateTemplateForm = ({ onTemplateCreated, closeModal }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { token } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/templates/', { name, description }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onTemplateCreated();
            closeModal();
        } catch (error) {
            console.error("Error al crear la plantilla:", error);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
            <h2 className="text-2xl font-bold">Nueva Plantilla</h2>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la Plantilla (ej: Low-Level Design)" required className="w-full p-2 bg-gray-800 rounded-md" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción corta" className="w-full p-2 bg-gray-800 rounded-md h-24"></textarea>
            <div className="flex justify-end gap-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">Crear Plantilla</button>
            </div>
        </form>
    );
};

const TemplatesView = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { token } = useAuth();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/templates/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error("Error al cargar las plantillas", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTemplates();
    }
  }, [token]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Biblioteca de Plantillas</h1>
        <button onClick={() => setModalIsOpen(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">
          ＋ Nueva Plantilla
        </button>
      </div>
      {loading ? <p className="text-gray-400">Cargando plantillas...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{template.name}</h3>
                <p className="text-gray-400 mt-2 text-sm">{template.description}</p>
              </div>
              <div className="mt-4 border-t border-gray-700 pt-4">
                <Link to={`/templates/${template.id}`} className="text-purple-400 hover:text-white text-sm font-semibold">
                  Gestionar Versiones
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} style={modalStyles}>
        <CreateTemplateForm onTemplateCreated={fetchTemplates} closeModal={() => setModalIsOpen(false)} />
      </Modal>
    </div>
  );
};

export default TemplatesView;
