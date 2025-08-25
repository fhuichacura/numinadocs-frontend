import React, { useState } from 'react';

const AICompanionPanel = ({ selectedText, onAction }) => {
  const [prompt, setPrompt] = useState('');
  const canActOnSelection = selectedText && selectedText.trim() !== '';

  const handleGenerate = () => {
    if (prompt.trim() !== '') {
      onAction('mermaid', prompt); // Usamos 'mermaid' como ejemplo para la generación
      setPrompt('');
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg h-full sticky top-8">
      <h3 className="text-lg font-semibold text-white mb-4">Asistente IA</h3>
      
      <div className="space-y-2">
        <button 
          onClick={() => onAction('expand')}
          disabled={!canActOnSelection}
          className="w-full p-2 bg-gray-700 rounded-md text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-purple-600"
        >
          Expandir Selección
        </button>
        <button 
          onClick={() => onAction('rewrite')}
          disabled={!canActOnSelection}
          className="w-full p-2 bg-gray-700 rounded-md text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-purple-600"
        >
          Reescribir Selección
        </button>
        <button 
          onClick={() => onAction('summarize')}
          disabled={!canActOnSelection}
          className="w-full p-2 bg-gray-700 rounded-md text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-purple-600"
        >
          Resumir Selección
        </button>
      </div>

      <div className="mt-6 border-t border-gray-700 pt-4">
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Pide a la IA que genere algo nuevo (ej: un diagrama de flujo para...)" 
          className="w-full p-2 bg-gray-900 rounded-md text-white h-24 text-sm"
        />
        <button 
          onClick={handleGenerate}
          className="w-full mt-2 p-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold"
        >
          Generar
        </button>
      </div>
    </div>
  );
};

export default AICompanionPanel;