// src/components/nodes/NodePalette.jsx
import React from 'react';
import { typeTheme } from './index';

const items = [
  {type:'idea',     label:'Idea'},
  {type:'topic',    label:'Tópico'},
  {type:'task',     label:'Tarea'},
  {type:'decision', label:'Decisión'},
  {type:'note',     label:'Nota'},
  {type:'metric',   label:'Métrica'},
  {type:'risk',     label:'Riesgo'},
  {type:'persona',  label:'Persona'},
];

export default function NodePalette({ onAdd }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(it => {
        const th = typeTheme[it.type];
        return (
          <button
            key={it.type}
            onClick={() => onAdd(it.type)}
            className={`px-2.5 py-1 rounded border text-xs ${th.bg} ${th.border}`}
            title={`Insertar ${it.label}`}
          >
            {th.icon} {it.label}
          </button>
        );
      })}
    </div>
  );
}