// src/components/nodes/types/NoteNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { typeTheme } from '../index';

export default function NoteNode({ data }) {
  const theme = typeTheme.note;
  const text = data?.label || 'Nota rápida';

  return (
    <div className={`min-w-[180px] max-w-[240px] p-3 rounded-md border ${theme.bg} ${theme.border} shadow-sm`}>
      <div className="flex items-center gap-1 text-xs opacity-70">{theme.icon} Nota</div>
      <div className="text-[13px] leading-snug mt-1">{text}</div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right}/>
    </div>
  );
}