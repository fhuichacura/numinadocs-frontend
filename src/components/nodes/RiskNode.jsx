// src/components/nodes/types/RiskNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { typeTheme } from '../index';

export default function RiskNode({ data }) {
  const theme = typeTheme.risk;
  const label = data?.label || 'Riesgo';
  const severity = data?.severity || 'M'; // L|M|H

  const sevPill = {
    L: 'bg-emerald-500/30 text-emerald-200',
    M: 'bg-amber-500/30 text-amber-200',
    H: 'bg-rose-500/30 text-rose-200',
  }[severity] || 'bg-amber-500/30 text-amber-200';

  return (
    <div className={`min-w-[180px] px-3 py-2 rounded-lg border ${theme.bg} ${theme.border}`}>
      <div className="flex justify-between">
        <span className="text-xs opacity-70">{theme.icon} Riesgo</span>
        <span className={`text-[10px] px-2 py-0.5 rounded ${sevPill}`}>S:{severity}</span>
      </div>
      <div className={`text-sm font-medium ${theme.text}`}>{label}</div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom}/>
    </div>
  );
}