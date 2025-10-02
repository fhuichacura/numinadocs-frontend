import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

export default function MindmapList() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== "all") params.set("status", tab);
    if (q.trim()) params.set("q", q.trim());
    try {
      const { data } = await api.get(`/mindmaps?${params.toString()}`);
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [tab, q]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const onOpen = (id) => navigate(`/mindmap/${id}`);

  const onCreate = async () => {
    setCreating(true);
    try {
      const payload = { title: "Nuevo mapa", status: "draft", nodes: [{ label: "Idea principal" }], edges: [] };
      const { data } = await api.post("/mindmaps", payload);
      navigate(`/mindmap/${data.id}`);
    } finally {
      setCreating(false);
      fetchList();
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 border-r border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white/90 font-semibold">Mis Mapas</h2>
        <div className="flex items-center gap-2">
          <button onClick={fetchList} className="text-sm px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700" title="Actualizar">↻</button>
          <button onClick={onCreate} disabled={creating} className="text-sm px-3 py-1 rounded bg-indigo-600 text-white">{creating ? "Creando…" : "Nuevo"}</button>
        </div>
      </div>

      <div className="flex gap-2">
        {["all","draft","published"].map(k => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-xs px-2 py-1 rounded ${tab===k ? "bg-white/20" : "bg-white/10 hover:bg-white/15"}`}>
            {k==="all"?"Todos":k==="draft"?"Borradores":"Publicados"}
          </button>
        ))}
      </div>

      <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar…"
             className="mt-2 w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-sm" />

      <div className="space-y-2 mt-2">
        {loading && <div className="text-sm text-white/60">Cargando…</div>}
        {!loading && !items.length && <div className="text-sm text-white/50">No hay mapas. Crea uno nuevo.</div>}
        {items.map((m)=>(
          <div key={m.id} className={`rounded-xl p-3 border ${routeId===m.id ? "border-white/30 bg-white/5" : "border-white/10 hover:border-white/20"}`}>
            <div className="flex items-center justify-between gap-2">
              <button className="flex-1 text-left truncate" onClick={()=>onOpen(m.id)}>
                <div className="font-medium text-white/90 truncate">{m.title || "(sin título)"}</div>
                <div className="text-xs text-white/50">{(m.nodes?.length ?? 0)} nodos · {(m.edges?.length ?? 0)} enlaces</div>
              </button>
              <span className={`text-[10px] px-2 py-0.5 rounded ${m.status==="published"?"bg-emerald-500/20 text-emerald-300":"bg-amber-500/20 text-amber-300"}`}>
                {m.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
