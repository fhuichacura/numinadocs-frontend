import React from 'react';
import { Link } from 'react-router-dom';

const ProjectTable = ({ projects, loading }) => {
  return (
    // El contenedor principal ahora es flexible en altura
    <div className="bg-gray-800 rounded-lg p-6 flex flex-col h-full">
      <h2 className="text-xl font-semibold text-white mb-4">Proyectos</h2>
      
      {/* Contenedor de la tabla con altura máxima y scroll */}
      <div className="flex-grow overflow-y-auto -mx-6 px-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700 text-sm text-gray-400">
              <th className="p-3">Nombre del Proyecto</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Documentos</th>
              <th className="p-3">Última Actividad</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-3 text-center text-gray-400">Cargando proyectos...</td>
              </tr>
            ) : projects.length > 0 ? (
              projects.map(project => (
                <tr key={project.id} className="border-b border-gray-700 last:border-none hover:bg-gray-700">
                  <td className="p-3 font-semibold">
                    <Link to={`/projects/${project.id}`} className="text-purple-400 hover:text-purple-300">
                      {project.name}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">Activo</span>
                  </td>
                  <td className="p-3">5</td> {/* Placeholder */}
                  <td className="p-3">Hace 2 horas</td> {/* Placeholder */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-3 text-center text-gray-500">No hay proyectos creados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTable;