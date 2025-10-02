// src/components/nodes/types/IdeaNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { typeTheme } from '../index';

export default function IdeaNode({ data }) {
  const theme = typeTheme.idea;
  const label = data?.label || 'Idea';

  return (
    <div className={`min-w-[160px] max-w-[240px] px-3 py-2 rounded-lg border ${theme.bg} ${theme.border} shadow-sm`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{theme.icon} Idea</div>
      <div className={`text-sm font-medium ${theme.text}`}>{label}</div>

      <Handle type="target" position={Position.Top}  />
      <Handle type="source" position={Position.Bottom}/>
    </div>
  );
}