// src/components/nodes/types/TopicNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { typeTheme } from '../index';

export default function TopicNode({ data }) {
  const theme = typeTheme.topic;
  const label = data?.label || 'Topic';

  return (
    <div className={`min-w-[180px] max-w-[280px] px-3 py-2 rounded-xl border ${theme.bg} ${theme.border}`}>
      <div className="flex items-center gap-1 text-xs opacity-70">{theme.icon} Tópico</div>
      <div className={`text-[15px] font-semibold ${theme.text}`}>{label}</div>
      <Handle type="target" position={Position.Left}  />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}