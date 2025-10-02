// src/pages/ProjectListView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axios";
import Modal from "react-modal";

Modal.setAppElement("#root");

function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const canSave = name.trim().length > 2 && !isSaving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setIsSaving(true);
    try {
      const res = await apiClient.post(
        "/projects/",
        { name: name.trim(), description: description.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newId = res?.data?.id;
      setName(""); setDescription(""); onCreated?.(newId); onClose?.();
    } catch (err) {
      console.error("Error al crear el proyecto:", err);
      alert("No se pudo crear el proyecto.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isSaving ? undefined : onClose}
      style={{ content: { top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#0f172a", border: "1px solid #27272a", borderRadius: "1rem", width: "96%", maxWidth: 560, padding: "1.5rem"}, overlay: { backgroundColor: "rgba(0,0,0,0.75)"}}}>
      <form onSubmit={handleSubmit} className="space-y-4 text-white">
        <h2 className="text-2xl font-bold">➕ Nuevo Proyecto</h2>
        <p className="text-sm text-zinc-400">Crea un contenedor de trabajo. Podrás agregar documentos con IA en la vista del proyecto.</p>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del Proyecto" className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500" required/>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)" className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"/>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" disabled={isSaving} onClick={onClose} className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-60">Cancelar</button>
          <button type="submit" disabled={!canSave} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold disabled:opacity-60">{isSaving ? "Creando…" : "Crear Proyecto"}</button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/projects/${project.id}`)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/projects/${project.id}`)}
      className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/70 to-zinc-950/60 p-6 hover:border-purple-500/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to={`/projects/${project.id}`} onClick={(e) => e.stopPropagation()} className="text-xl font-semibold text-white hover:text-purple-300">
            {project.name}
          </Link>
          <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{project.description || "Sin descripción."}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-purple-600/20 text-purple-300 shrink-0">En Progreso</span>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Progreso</div>
          <div className="h-2 mt-2 bg-zinc-800 rounded-full">
            <div className="h-2 rounded-full bg-purple-600" style={{ width: "0%" }} />
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">0% completado</div>
        </div>
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Estado</div>
          <div className="font-semibold text-emerald-400">🟢 En Curso</div>
          <div className="text-[11px] text-zinc-500">Fase 1: Despliegue Inicial</div>
        </div>
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Próximo Hito</div>
          <div className="font-medium text-white">Implementar Alembic</div>
          <div className="text-[11px] text-zinc-500">Versionamiento de BD</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-zinc-500">Última Actividad: Recién Creado</div>
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(project); }} className="text-xs px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white">
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 animate-pulse">
      <div className="h-6 w-48 bg-zinc-800 rounded"></div>
      <div className="h-3 w-80 bg-zinc-800 rounded mt-3"></div>
      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        <div className="h-16 bg-zinc-800 rounded-xl" /><div className="h-16 bg-zinc-800 rounded-xl" /><div className="h-16 bg-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}

export default function ProjectListView() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true); setErr("");
      const res = await apiClient.get("/projects/", { headers: { Authorization: `Bearer ${token}` } });
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error al cargar proyectos:", e);
      setErr("No se pudieron cargar los proyectos."); setProjects([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    const data = !q ? projects : projects.filter(
      p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );
    setFiltered(data);
  }, [projects, query]);

  const total = useMemo(() => projects.length, [projects]);

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.name}"?`)) return;
    try {
      setProjects(prev => prev.filter(x => x.id !== p.id));
      await apiClient.delete(`/projects/${p.id}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.error("Error al eliminar:", e); alert("No se pudo eliminar el proyecto."); await load();
    }
  };

  return (
    <div className="p-6 md:p-10 text-zinc-200 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Flujo de Proyectos</h1>
          <p className="text-sm text-zinc-400">Total: {total}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar proyectos…" className="w-64 p-2 pl-9 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"/>
            <span className="absolute left-2 top-2.5 text-zinc-500">🔎</span>
          </div>
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold">＋ Nuevo Proyecto</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300">Progreso General del Despliegue v1</p>
          <div className="h-2 mt-2 bg-zinc-800 rounded-full"><div className="h-2 bg-purple-600 rounded-full" style={{ width: "0%" }} /></div>
          <p className="text-[11px] text-zinc-500 mt-1">0% completado</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300">Estado del Proyecto</p>
          <p className="text-lg font-semibold text-emerald-400 mt-1">🟢 En Curso</p>
          <p className="text-[11px] text-zinc-500">Fase 1: Despliegue Inicial</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300">Próximo Hito Crítico</p>
          <p className="text-lg font-semibold">Implementar Alembic</p>
          <p className="text-[11px] text-zinc-500">Versionamiento de la Base de Datos</p>
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-800 bg-red-900/20 p-4 text-red-300">{err} <button onClick={load} className="underline ml-2">Reintentar</button></div>}

      {loading ? (
        <div className="flex flex-col gap-5"><ProjectSkeleton/><ProjectSkeleton/><ProjectSkeleton/></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center">
          <p className="text-zinc-300">No hay proyectos que coincidan.</p>
          <button onClick={() => setModalOpen(true)} className="mt-4 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700">Crear el primero</button>
          <button onClick={() => { setQuery(""); load(); }} className="mt-4 ml-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200">Limpiar filtro</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">{filtered.map(p => <ProjectCard key={p.id} project={p} onDelete={handleDelete} />)}</div>
      )}

      <CreateProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={(newId) => { load(); if (newId) navigate(`/projects/${newId}`); }} />
    </div>
  );
}