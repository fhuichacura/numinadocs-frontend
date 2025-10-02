// src/components/roadmap/RoadmapBoard.jsx
import React, { useState } from "react";
import apiClient from "../../api/axios";
import RoadmapCard from "./RoadmapCard";

const SparkIcon = ({ className="w-4 h-4" }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden>
    <defs>
      <linearGradient id="nd-spark" x1="0" x2="1">
        <stop offset="0" stopColor="#22d3ee"/>
        <stop offset="1" stopColor="#8b5cf6"/>
      </linearGradient>
    </defs>
    <path d="M32 6l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="url(#nd-spark)"/>
  </svg>
);

export default function RoadmapBoard({ projectId, token }) {
  const [lanes, setLanes] = useState({
    backlog: [],
    doing: [],
    done: [],
  });
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const addManual = () => {
    if (!newTitle.trim()) return;
    setLanes(prev => ({
      ...prev,
      backlog: [{ id: crypto.randomUUID(), title: newTitle.trim(), prio: "M" }, ...prev.backlog],
    }));
    setNewTitle("");
  };

  const move = (from, to, id) => {
    setLanes(prev => {
      const src = [...prev[from]];
      const idx = src.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const item = src.splice(idx, 1)[0];
      const dst = [item, ...prev[to]];
      return { ...prev, [from]: src, [to]: dst };
    });
  };

  const suggestAI = async () => {
    setBusy(true); setMsg("Consultando IA para sugerir hitos…");
    try {
      const res = await apiClient.post("/ai/roadmap_suggest", { project_id: projectId }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { items: [] }}));

      const items = res?.data?.items?.map(x => ({ id: crypto.randomUUID(), ...x }))
        || [
          { id: crypto.randomUUID(), title: "Versionamiento de BD (Alembic)", prio: "H" },
          { id: crypto.randomUUID(), title: "Pipeline CI/CD para NuminaDocs", prio: "M" },
          { id: crypto.randomUUID(), title: "Búsqueda Semántica (Vector DB)", prio: "M" },
        ];

      setLanes(prev => ({ ...prev, backlog: [...items, ...prev.backlog] }));
      setMsg("Sugerencias agregadas al Backlog.");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 1600);
    }
  };

  const Lane = ({ id, title, items }) => (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-[11px] text-zinc-500">{items.length}</div>
      </div>
      <div className="space-y-2 min-h-[120px]">
        {items.map(it => (
          <RoadmapCard key={it.id} item={it} laneId={id} onMove={move} />
        ))}
        {items.length === 0 && <div className="text-sm text-zinc-500">Vacío</div>}
      </div>
    </div>
  );

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nuevo hito…"
              className="w-72 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm"
            />
            <button onClick={addManual} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm">
              Añadir
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={suggestAI} disabled={busy} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center gap-2">
              <SparkIcon className="w-4 h-4" />
              {busy ? "Generando…" : "Sugerir con IA"}
            </button>
            {msg && <span className="text-xs text-purple-300">{msg}</span>}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Lane id="backlog" title="Backlog" items={lanes.backlog} />
        <Lane id="doing" title="En curso" items={lanes.doing} />
        <Lane id="done" title="Hecho" items={lanes.done} />
      </div>
    </section>
  );
}