// src/components/nodes/types/DecisionNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { typeTheme } from '../index';

export default function DecisionNode({ data }) {
  const theme = typeTheme.decision;
  const label = data?.label || 'Decisión';

  return (
    <div className="relative">
      <div className={`w-[180px] h-[100px] rotate-45 flex items-center justify-center border ${theme.bg} ${theme.border} rounded-md`}>
        <div className="-rotate-45 text-center">
          <div className="text-xs opacity-70">{theme.icon} Decisión</div>
          <div className={`text-sm font-medium ${theme.text}`}>{label}</div>
        </div>
      </div>
      <Handle type="target" position={Position.Top}    />
      <Handle type="source" position={Position.Right}  />
      <Handle type="source" position={Position.Left}   />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}