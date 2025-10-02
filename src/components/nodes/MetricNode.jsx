// src/components/nodes/types/MetricNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { typeTheme } from '../index';

export default function MetricNode({ data }) {
  const theme = typeTheme.metric;
  const label = data?.label || 'Métrica';
  const value = data?.value ?? '0';

  return (
    <div className={`min-w-[160px] px-3 py-2 rounded-lg border ${theme.bg} ${theme.border}`}>
      <div className="flex items-center gap-1 text-xs opacity-70">{theme.icon} KPI</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-2xl font-bold ${theme.text}`}>{value}</div>
        <div className="text-xs opacity-60">{label}</div>
      </div>

      <Handle type="target" position={Position.Top}    />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}