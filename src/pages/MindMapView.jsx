import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Proyecto Principal' }, type: 'input', style: { background: '#5B21B6', color: 'white', border: 'none', padding: '1rem' } },
  { id: '2', position: { x: -250, y: 150 }, data: { label: 'Documento Técnico' }, style: { background: '#374151', color: 'white', border: '1px solid #4B5563' } },
  { id: '3', position: { x: 0, y: 200 }, data: { label: 'Informe Ejecutivo' }, style: { background: '#374151', color: 'white', border: '1px solid #4B5563' } },
  { id: '4', position: { x: 250, y: 150 }, data: { label: 'Propuesta Comercial' }, style: { background: '#374151', color: 'white', border: '1px solid #4B5563' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e1-4', source: '1', target: '4', animated: true },
];

const MindMapView = () => {
  return (
    <div style={{ height: 'calc(100vh - 8rem)' }}>
      <h1 className="text-3xl font-bold text-white mb-6">Mapa Mental / Brainstorming</h1>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
      >
        <Background variant="dots" gap={16} size={1} color="#4A5568" />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default MindMapView;