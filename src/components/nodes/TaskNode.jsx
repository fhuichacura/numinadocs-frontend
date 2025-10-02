// src/components/nodes/types/TaskNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { typeTheme } from '../index';

export default function TaskNode({ data }) {
  const theme = typeTheme.task;
  const label = data?.label || 'Tarea';
  const status = data?.status || 'todo'; // todo|doing|done

  const pill = {
    todo:  'bg-gray-600/30 text-gray-200',
    doing: 'bg-amber-500/30 text-amber-200',
    done:  'bg-emerald-500/30 text-emerald-200',
  }[status] || 'bg-gray-600/30 text-gray-200';

  return (
    <div className={`min-w-[200px] px-3 py-2 rounded-lg border ${theme.bg} ${theme.border}`}>
      <div className="flex justify-between items-center">
        <div className="text-xs opacity-70">{theme.icon} Tarea</div>
        <span className={`text-[10px] px-2 py-0.5 rounded ${pill}`}>{status}</span>
      </div>
      <div className={`text-sm font-medium ${theme.text}`}>{label}</div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right}/>
    </div>
  );
}