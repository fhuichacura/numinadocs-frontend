// src/pages/MindMapView.jsx
import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function MindMapView() {
  const [mapId, setMapId] = useState(null);
  const [title, setTitle] = useState('Proyecto Principal');
  const [status, setStatus] = useState('draft');
  const [nodes, setNodes] = useState([
    { id: 'n1', label: 'Proyecto Principal', data: {} },
  ]);
  const [edges, setEdges] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  // Guardar borrador
  async function saveDraft() {
    setSaving(true);
    try {
      const payload = {
        id: mapId, title, status: 'draft',
        nodes: nodes.map(n => ({ id: n.id, label: n.label, data: n.data })),
        edges: edges.map(e => ({ id: e.id, source_id: e.source, target_id: e.target, data: e.data })),
      };
      const { data } = await api.post('/mindmaps', payload);
      setMapId(data.id);
      setStatus(data.status);
      // sincroniza ids reales con frontend si cambias lib (opcional)
      alert('Borrador guardado');
    } finally { setSaving(false); }
  }

  // Expansión IA
  async function expandAI() {
    if (!mapId) { await saveDraft(); }
    const { data } = await api.post(`/mindmaps/${mapId || ''}/ai/expand`, { prompt });
    setNodes(data.nodes.map(n => ({ id: n.id, label: n.label, data: n.data })));
    setEdges(data.edges.map(e => ({ id: e.id, source: e.source_id, target: e.target_id, data: e.data })));
    setPrompt('');
  }

  // Publicar → proyecto
  async function publish() {
    if (!mapId) { await saveDraft(); }
    const { data } = await api.post(`/mindmaps/${mapId || ''}/publish`);
    alert(`Proyecto creado: ${data.project_id}`);
    // opcional: navegar a /projects/${data.project_id}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="px-3 py-2 rounded bg-gray-800 border border-gray-700"
          value={title} onChange={e=>setTitle(e.target.value)}
        />
        <button onClick={saveDraft} disabled={saving} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700">
          {saving ? 'Guardando…' : 'Guardar borrador'}
        </button>
        <button onClick={publish} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700">
          Publicar como Proyecto
        </button>
      </div>

      {/* aquí va tu canvas de nodos/edges (ReactFlow u otro) */}

      <div className="mt-6 p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
        <label className="block text-sm text-gray-300 mb-2">Dame ideas sobre…</label>
        <div className="flex gap-3">
          <input
            className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-700"
            placeholder="(ej.) Arquitectura del sistema de pagos"
            value={prompt} onChange={e=>setPrompt(e.target.value)}
          />
          <button onClick={expandAI} className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700">
            Expandir con IA
          </button>
        </div>
      </div>
    </div>
  );
}
