import { useNavigate } from "react-router-dom";

const statusChip = {
  in_progress: { text: "En Progreso", cls: "bg-purple-600/20 text-purple-300" },
  paused: { text: "Pausado", cls: "bg-yellow-600/20 text-yellow-300" },
  completed: { text: "Completado", cls: "bg-emerald-600/20 text-emerald-300" },
};

export default function ProjectCard({ project, onEdit, onPublish, onDelete }) {
  const navigate = useNavigate();
  const st = statusChip[project.status] || statusChip.in_progress;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-purple-500/40 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-4 justify-between">
        <div>
          <h3
            onClick={() => navigate(`/projects/${project.id}`)}
            className="text-xl font-semibold text-zinc-100 hover:text-white cursor-pointer"
          >
            {project.name}
          </h3>
          <p className="text-sm text-zinc-400">{project.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${st.cls}`}>
            {st.text}
          </span>
          <button
            className="text-xs px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            onClick={() => onEdit?.(project)}
          >
            Editar
          </button>
          <button
            className="text-xs px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => onPublish?.(project)}
          >
            Publicar
          </button>
          <button
            className="text-xs px-3 py-1 rounded-full bg-red-600/80 hover:bg-red-600 text-white"
            onClick={() => onDelete?.(project)}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Mini dashboard dentro del contenedor */}
      <div className="mt-4 grid md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-300">Progreso</p>
          <div className="h-2 mt-2 bg-zinc-800 rounded-full">
            <div
              className="h-2 bg-purple-600 rounded-full"
              style={{ width: `${project.progress ?? 0}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-400">{project.progress ?? 0}% completado</p>
        </div>

        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-300">Estado</p>
          <p className="text-lg font-semibold text-emerald-400 mt-1">
            {st.text}
          </p>
          <p className="text-xs text-zinc-500">Fase 1: Despliegue Inicial</p>
        </div>

        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-300">Próximo Hito</p>
          <p className="text-zinc-100 font-medium mt-1">{project.nextMilestone || "Por definir"}</p>
          <p className="text-xs text-zinc-500">Última Actividad: {project.lastActivity}</p>
        </div>
      </div>
    </div>
  );
}