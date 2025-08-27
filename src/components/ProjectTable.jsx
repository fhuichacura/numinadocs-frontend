// src/components/ProjectTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function formatDate(value) {
  try {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * ProjectTable
 * Props:
 *  - projects: array de objetos (id, name, owner, status, updated_at...)
 *  - loading: bool
 */
export default function ProjectTable({ projects = [], loading = false }) {
  // filas de loading (no usan texto suelto)
  const skeletonRows = Array.from({ length: 5 }).map((_, i) => (
    <tr key={`sk-${i}`}>
      <td className="px-4 py-3"><div className="h-4 w-40 bg-gray-700/50 rounded" /></td>
      <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-700/50 rounded" /></td>
      <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-700/50 rounded" /></td>
      <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-700/50 rounded" /></td>
      <td className="px-4 py-3 text-right"><div className="h-8 w-24 bg-gray-700/50 rounded" /></td>
    </tr>
  ));

  const rows = !loading
    ? projects.map((p) => {
        const id = p.id ?? p.project_id;
        const name = p.name ?? p.project_name ?? 'Proyecto';
        const owner = p.owner ?? p.owner_name ?? '—';
        const status = (p.status ?? 'N/A').toString();
        const updated = p.updated_at ?? p.last_updated;

        const statusClass =
          status.toLowerCase() === 'active'
            ? 'bg-green-500/20 text-green-300'
            : status.toLowerCase() === 'paused'
            ? 'bg-yellow-500/20 text-yellow-300'
            : 'bg-gray-500/20 text-gray-300';

        return (
          <tr key={id ?? name}>
            <td className="px-4 py-3 text-white font-medium">
              <Link
                to={`/projects/${id ?? ''}`}
                className="hover:underline"
              >
                {name}
              </Link>
            </td>
            <td className="px-4 py-3 text-gray-300">{owner}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${statusClass}`}>
                {status}
              </span>
            </td>
            <td className="px-4 py-3 text-gray-300">{formatDate(updated)}</td>
            <td className="px-4 py-3 text-right">
              <Link
                to={`/projects/${id ?? ''}`}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-sm"
              >
                Abrir
              </Link>
            </td>
          </tr>
        );
      })
    : skeletonRows;

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800/60 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Proyecto</th>
              <th className="px-4 py-3 text-left font-semibold">Owner</th>
              <th className="px-4 py-3 text-left font-semibold">Estado</th>
              <th className="px-4 py-3 text-left font-semibold">Actualizado</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>

      {!loading && projects.length === 0 ? (
        <div className="p-6 text-gray-400">No hay proyectos todavía.</div>
      ) : null}
    </div>
  );
}
