import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';

const modalStyles = {
  content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', background: '#1a202c', border: '1px solid #4a5568', borderRadius: '1rem', width: '90%', maxWidth: '500px' },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' }
};
Modal.setAppElement('#root');

const CreateProjectForm = ({ onProjectCreated, closeModal }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { token } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/projects/', { name, description }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onProjectCreated();
            closeModal();
        } catch (error) {
            console.error("Error al crear el proyecto:", error);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
            <h2 className="text-2xl font-bold">Nuevo Proyecto</h2>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del Proyecto" required className="w-full p-2 bg-gray-800 rounded-md" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" className="w-full p-2 bg-gray-800 rounded-md h-24"></textarea>
            <div className="flex justify-end gap-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">Crear Proyecto</button>
            </div>
        </form>
    );
};

const ProjectCard = ({ project }) => (
  <Link to={`/projects/${project.id}`}>
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-800/30 cursor-pointer">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">{project.name}</h3>
        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">En Progreso</span>
      </div>
      <p className="text-sm text-gray-400 mt-2 h-10 overflow-hidden">{project.description || 'Sin descripción.'}</p>
      <div className="mt-4 border-t border-gray-700 pt-4 flex justify-between items-center">
        <div className="text-xs text-gray-500">Documentos: 0</div>
        <div className="text-xs text-gray-500">Última Actividad: Recién Creado</div>
      </div>
    </div>
  </Link>
);

const ProjectListView = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { token } = useAuth();

  const fetchProjects = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await apiClient.get('/projects/', { headers: { Authorization: `Bearer ${token}` } });
      setProjects(response.data);
    } catch (error) {
      console.error("Error al cargar los proyectos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [token]);

  if (loading) return <p className="text-gray-400">Cargando flujo de datos...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Flujo de Proyectos</h1>
        <button onClick={() => setModalIsOpen(true)} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white transition-colors">
          ＋ Nuevo Proyecto
        </button>
      </div>
      <div className="flex flex-col gap-6">
        {projects.length > 0 ? projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        )) : <p className="text-gray-500 text-center py-10">No hay proyectos. ¡Crea el primero!</p>}
      </div>
      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} style={modalStyles}>
        <CreateProjectForm onProjectCreated={fetchProjects} closeModal={() => setModalIsOpen(false)} />
      </Modal>
    </div>
  );
};

export default ProjectListView;
