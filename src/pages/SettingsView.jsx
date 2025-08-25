import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import Modal from 'react-modal';

// Estilos para el modal (si se usara en el futuro)
const modalStyles = {
  content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', background: '#1f2937', border: '1px solid #4b5563', borderRadius: '1rem', width: '90%', maxWidth: '600px', padding: '2rem' },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' }
};
Modal.setAppElement('#root');

// --- PESTAÑA: MI PERFIL (CORREGIDA Y COMPLETA) ---
const ProfileTab = () => {
  const { user, refreshUser, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');

  // Actualiza el estado si el usuario cambia (ej. después de refrescar)
  useEffect(() => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
  }, [user]);

  const handleSave = async () => {
    try {
      await apiClient.put('/users/me', { first_name: firstName, last_name: lastName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshUser(); // Refresca el usuario en toda la app
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar el perfil", error);
    }
  };

  const handleCancel = () => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setIsEditing(false);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Información del Perfil</h2>
        {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-purple-400 hover:text-white">Editar</button>
        )}
      </div>
      
      {/* Sección de Campos Editables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label className="text-sm text-gray-400">Nombre</label>
            {isEditing ? (
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nombre" className="w-full p-2 bg-gray-900 rounded-md mt-1" />
            ) : (
                <p className="text-lg font-semibold text-white mt-1">{firstName || 'No especificado'}</p>
            )}
        </div>
        <div>
            <label className="text-sm text-gray-400">Apellido</label>
            {isEditing ? (
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apellido" className="w-full p-2 bg-gray-900 rounded-md mt-1" />
            ) : (
                <p className="text-lg font-semibold text-white mt-1">{lastName || 'No especificado'}</p>
            )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 flex justify-end gap-4">
            <button onClick={handleCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">Guardar Cambios</button>
        </div>
      )}
      
      <hr className="border-gray-700 my-6" />

      {/* Sección de Información Fija de la Cuenta */}
      <h3 className="text-lg font-semibold text-white mb-4">Detalles de la Cuenta</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Email</div>
            <div className="text-lg font-semibold text-white">{user?.email}</div>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Tipo de Suscripción</div>
            <div className="text-lg font-semibold text-purple-400">Empresarial Anual</div>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Estado</div>
            <div className="text-lg font-semibold text-green-400">Activa</div>
        </div>
      </div>
    </div>
  );
};


// --- PESTAÑA: PERSONALIZACIÓN DE IA (FUNCIONAL) ---
const AIPersonalizationTab = () => {
    const { token } = useAuth();
    const [interests, setInterests] = useState([]);
    const [newInterest, setNewInterest] = useState('');
    const [personality, setPersonality] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            if (!token) return;
            try {
                const response = await apiClient.get('/settings/ai', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setInterests(response.data.ai_interests || []);
                setPersonality(response.data.ai_personality || '');
            } catch (error) {
                console.error("Error al cargar la configuración de IA", error);
            }
        };
        fetchSettings();
    }, [token]);
    
    const handleAddInterest = () => {
        if (newInterest && !interests.includes(newInterest)) {
            setInterests([...interests, newInterest]);
            setNewInterest('');
        }
    };
    
    const handleRemoveInterest = (interestToRemove) => {
        setInterests(interests.filter(interest => interest !== interestToRemove));
    };

    const handleSaveAISettings = async () => {
        try {
            const payload = {
                ai_personality: personality,
                ai_interests: interests
            };
            await apiClient.put('/settings/ai', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('¡Configuración guardada con éxito!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error al guardar la configuración de IA", error);
            setMessage('Error al guardar. Inténtalo de nuevo.');
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Tono y Estilo de la IA</h2>
            <textarea
                placeholder="Describe cómo quieres que la IA se comunique. Por ejemplo: 'Actúa como un CEO. Sé directo, conciso y enfocado en resultados.'"
                className="w-full h-24 p-2 bg-gray-900 rounded-md text-white text-sm"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
            />
            
            <hr className="border-gray-700 my-6" />

            <h2 className="text-xl font-semibold text-white mb-4">Temas de Interés para el Informe</h2>
            <p className="text-sm text-gray-400 mb-4">Añade los temas que quieres que NuminaDocs monitoree para ti (ej: FinOps, Serverless, Venture Capital).</p>
            <div className="flex flex-wrap gap-2 items-center mb-4">
                {interests.map(interest => (
                    <div key={interest} className="bg-purple-500/20 text-purple-300 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                        <span>{interest}</span>
                        <button onClick={() => handleRemoveInterest(interest)} className="hover:text-white text-lg leading-none pb-1">&times;</button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input 
                    placeholder="Añadir nuevo tema..." 
                    className="flex-grow p-2 bg-gray-900 rounded-md text-white text-sm"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInterest(); }}}
                />
                <button onClick={handleAddInterest} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Añadir</button>
            </div>
            
            <div className="mt-8 flex justify-end items-center gap-4">
                {message && <p className="text-sm text-green-400">{message}</p>}
                <button onClick={handleSaveAISettings} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">Guardar Configuración de IA</button>
            </div>
        </div>
    );
};


// --- PESTAÑA: INTEGRACIONES (PLACEHOLDER) ---
const IntegrationsTab = () => (
    <div>
        <h2 className="text-xl font-semibold text-white mb-4">Conecta tus Herramientas</h2>
        <p className="text-gray-400">Próximamente podrás conectar herramientas como Jira, Slack, y tu ERP para una sincronización de datos completa.</p>
    </div>
);


// --- COMPONENTE PRINCIPAL ---
const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Configuración</h1>
      <div className="flex border-b border-gray-700 mb-6">
        <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 font-semibold ${activeTab === 'profile' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400'}`}>Mi Perfil</button>
        <button onClick={() => setActiveTab('ai')} className={`px-4 py-2 font-semibold ${activeTab === 'ai' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400'}`}>Personalización de IA</button>
        <button onClick={() => setActiveTab('integrations')} className={`px-4 py-2 font-semibold ${activeTab === 'integrations' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400'}`}>Integraciones</button>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'ai' && <AIPersonalizationTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
      </div>
    </div>
  );
};

export default SettingsView;