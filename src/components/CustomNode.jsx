// src/components/CustomNode.jsx
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Link } from 'react-router-dom';

const CustomNode = ({ data }) => {
  return (
    <Link to={`/projects/${data.id}`}>
      <div 
        className="bg-gray-800 text-gray-200 border border-gray-600 rounded-lg w-48 p-4 hover:border-purple-500 transition-all duration-200 cursor-pointer shadow-lg"
      >
        <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-teal-500" />
        <div className="font-bold text-white mb-1">{data.label}</div>
        <div className="text-xs text-gray-400">{data.description || 'Sin descripción'}</div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-teal-500" />
      </div>
    </Link>
  );
};

export default memo(CustomNode);