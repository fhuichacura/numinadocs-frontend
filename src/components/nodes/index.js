// src/components/nodes/index.js
import IdeaNode     from './types/IdeaNode.jsx';
import TopicNode    from './types/TopicNode.jsx';
import TaskNode     from './types/TaskNode.jsx';
import DecisionNode from './types/DecisionNode.jsx';
import NoteNode     from './types/NoteNode.jsx';
import MetricNode   from './types/MetricNode.jsx';
import RiskNode     from './types/RiskNode.jsx';
import PersonaNode  from './types/PersonaNode.jsx';

/**
 * Mapa de tipos para React Flow.
 * value = React component; key = node.type
 */
export const NODE_TYPES = {
  idea:     IdeaNode,
  topic:    TopicNode,
  task:     TaskNode,
  decision: DecisionNode,
  note:     NoteNode,
  metric:   MetricNode,
  risk:     RiskNode,
  persona:  PersonaNode,
};

/**
 * Utilidad para dar estilo por tipo (por si quieres reusar colores)
 */
export const typeTheme = {
  idea:     {bg: 'bg-indigo-600/15',   border: 'border-indigo-400/60',   text: 'text-indigo-200',   icon: '💡'},
  topic:    {bg: 'bg-sky-600/15',      border: 'border-sky-400/60',      text: 'text-sky-200',      icon: '🧭'},
  task:     {bg: 'bg-emerald-600/15',  border: 'border-emerald-400/60',  text: 'text-emerald-200',  icon: '✅'},
  decision: {bg: 'bg-amber-600/15',    border: 'border-amber-400/60',    text: 'text-amber-200',    icon: '◆'},
  note:     {bg: 'bg-yellow-400/20',   border: 'border-yellow-300/70',   text: 'text-yellow-950',   icon: '🗒️'},
  metric:   {bg: 'bg-fuchsia-600/15',  border: 'border-fuchsia-400/60',  text: 'text-fuchsia-200',  icon: '📈'},
  risk:     {bg: 'bg-rose-600/15',     border: 'border-rose-400/60',     text: 'text-rose-200',     icon: '⚠️'},
  persona:  {bg: 'bg-teal-600/15',     border: 'border-teal-400/60',     text: 'text-teal-200',     icon: '👤'},
};