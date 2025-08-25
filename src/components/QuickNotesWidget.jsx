import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';

Modal.setAppElement('#root');

const QuickNotesWidget = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { token } = useAuth();

  const fetchNotes = async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/quick-notes/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data);
    } catch (error) {
      console.error("Error al cargar notas:", error);
    }
  };

  useEffect(() => {
    // Carga las notas la primera vez
    fetchNotes();
  }, [token]);

  const handleOpenModal = () => {
    fetchNotes(); // Vuelve a cargar las notas cada vez que se abre el modal
    setModalIsOpen(true);
  };

  const handleSaveNote = async () => {
    if (newNote.trim() === '') return;
    try {
      await apiClient.post('/quick-notes/', { content: newNote }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewNote('');
      fetchNotes();
    } catch (error) {
      console.error("Error al guardar nota:", error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await apiClient.delete(`/quick-notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotes(); // Refresca la lista después de eliminar
    } catch (error) {
      console.error("Error al eliminar la nota:", error);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Apuntes Rápidos</h2>
        <button onClick={handleOpenModal} className="text-sm text-purple-400 hover:text-white">Ver todo</button>
      </div>
      <textarea 
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Escribe una nota rápida..." 
        className="w-full p-2 bg-gray-900 rounded-md text-white text-sm h-24 resize-none"
      />
      <button onClick={handleSaveNote} className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">Guardar Nota</button>

      <Modal 
        isOpen={modalIsOpen} 
        onRequestClose={() => setModalIsOpen(false)}
        className="absolute w-11/12 max-w-2xl p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-xl text-white"
        overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Todos los Apuntes</h2>
          <button onClick={() => setModalIsOpen(false)} className="text-2xl text-gray-400 hover:text-white">&times;</button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {notes.length > 0 ? notes.map(note => (
            <div key={note.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-start">
              <p className="text-gray-300 mr-4">{note.content}</p>
              <button onClick={() => handleDeleteNote(note.id)} className="text-xs text-red-400 hover:text-red-300 flex-shrink-0">Eliminar</button>
            </div>
          )) : <p className="text-gray-500">No hay notas guardadas.</p>}
        </div>
      </Modal>
    </div>
  );
};

export default QuickNotesWidget;