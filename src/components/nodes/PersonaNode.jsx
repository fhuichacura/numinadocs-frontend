// src/components/nodes/types/PersonaNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { typeTheme } from '../index';

export default function PersonaNode({ data }) {
  const theme = typeTheme.persona;
  const name  = data?.label || 'Persona';
  const role  = data?.role || 'Rol';
  const org   = data?.org || 'Organización';

  return (
    <div className={`min-w-[200px] px-3 py-2 rounded-lg border ${theme.bg} ${theme.border}`}>
      <div className="flex items-center gap-2">
        <div className="text-xl">🧑‍💻</div>
        <div>
          <div className={`text-sm font-semibold ${theme.text}`}>{name}</div>
          <div className="text-[11px] opacity-70 leading-tight">{role} · {org}</div>
        </div>
      </div>

      <Handle type="target" position={Position.Left}/>
      <Handle type="source" position={Position.Right}/>
    </div>
  );
}