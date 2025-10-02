// src/pages/MindmapPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import MindMapView from "../components/MindMapView";

/* helpers */
const cx = (...xs) => xs.filter(Boolean).join(" ");
const useDebounced = (v, d=350)=>{const[s,set]=useState(v);useEffect(()=>{const t=setTimeout(()=>set(v),d);return()=>clearTimeout(t)},[v,d]);return s};

function Toast({ text, kind="ok", onClose }) {
  if (!text) return null;
  const bg = kind==="err"?"bg-red-600":"bg-emerald-600";
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg shadow-lg text-white ${bg}`}>
      <span className="text-sm">{text}</span>
      <button className="ml-3 underline text-sm" onClick={onClose}>Cerrar</button>
    </div>
  );
}

function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="absolute left-1/2 top-1/2 w-[min(92vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gray-900 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="font-semibold text-white/90">{title}</div>
          <button className="text-white/60 hover:text-white" onClick={onClose}>✕</button>
        </div>
        <div className="p-5">{children}</div>
        {actions ? <div className="px-5 pb-5">{actions}</div> : null}
      </div>
    </div>
  );
}

function MapCard({ item, active, onOpen, onRename, onDuplicate, onExport, onPublish, onDelete }) {
  const badge = item.status==="published"?"bg-emerald-500/15 text-emerald-300":"bg-amber-500/15 text-amber-300";
  const nodeCount = item.nodes?.length ?? 0;
  const edgeCount = item.edges?.length ?? 0;
  return (
    <div className={cx("rounded-xl p-3 border transition", active?"border-white/30 bg-white/5":"border-white/10 hover:border-white/20")}>
      <div className="flex items-start gap-2">
        <button className="flex-1 text-left group" title="Abrir" onClick={()=>onOpen(item.id)}>
          <div className="flex items-center gap-2">
            <div className="font-medium text-white/90 truncate group-hover:text-white">{item.title || "(sin título)"}</div>
            <span className={`text-[10px] px-2 py-0.5 rounded ${badge}`}>{item.status}</span>
          </div>
          <div className="text-xs text-white/50 mt-0.5">{nodeCount} nodos · {edgeCount} enlaces</div>
        </button>
        <div className="flex flex-col gap-1">
          <button onClick={()=>onRename(item)} className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20">Renombrar</button>
          <button onClick={()=>onDuplicate(item)} className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20">Duplicar</button>
          <button onClick={()=>onExport(item)} className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20">Exportar</button>
          <button onClick={()=>onPublish(item)} className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white">Publicar</button>
          <button onClick={()=>onDelete(item)} className="px-2 py-1 text-xs rounded bg-red-600/80 hover:bg-red-500 text-white">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

export default function MindmapPage() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const qDeb = useDebounced(q, 300);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState({ text: "", kind: "ok" });

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameText, setRenameText] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportText, setExportText] = useState("");

  const activeId = routeId || null;

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("status", tab);        // <— igual que backend
      if (qDeb.trim()) params.set("q", qDeb.trim());
      const { data } = await api.get(`/mindmaps?${params.toString()}`);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setToast({ text: "No fue posible cargar los mapas.", kind: "err" });
    } finally {
      setLoading(false);
    }
  }, [tab, qDeb]);

  useEffect(()=>{ fetchList(); }, [fetchList]);

  const onOpen = (id)=> navigate(`/mindmap/${id}`);

  const onCreate = async ()=> {
    try{
      setCreating(true);
      const payload = { title:"Nuevo mapa", status:"draft", nodes:[{label:"Idea principal", data:{}}], edges:[] };
      const { data } = await api.post("/mindmaps", payload);
      setToast({ text:"Borrador creado", kind:"ok" });
      navigate(`/mindmap/${data.id}`);
    }catch{ setToast({ text:"No se pudo crear el mapa", kind:"err" }); }
    finally{ setCreating(false); fetchList(); }
  };

  const onRename = (item)=>{ setRenameTarget(item); setRenameText(item.title||""); setRenameOpen(true); };
  const applyRename = async ()=>{
    try{
      await api.patch(`/mindmaps/${renameTarget.id}`, { title: renameText });
      setRenameOpen(false); fetchList(); setToast({ text:"Nombre actualizado", kind:"ok" });
    }catch{ setToast({ text:"No se pudo renombrar", kind:"err" }); }
  };

  const onDuplicate = async (item)=>{
    try{
      const { data } = await api.get(`/mindmaps/${item.id}`);
      const idMap = {};
      const newNodes = (data.nodes||[]).map(n=>{ const nid=crypto.randomUUID(); idMap[n.id]=nid; return { id:nid, label:n.label, data:n.data||{} }; });
      const newEdges = (data.edges||[]).map(e=>({ source_id:idMap[e.source_id]||e.source_id, target_id:idMap[e.target_id]||e.target_id, label:e.label||"" }));
      const payload = { title:`Copia de ${data.title||"mapa"}`, status:"draft", nodes:newNodes, edges:newEdges };
      const created = await api.post("/mindmaps", payload);
      setToast({ text:"Mapa duplicado", kind:"ok" }); navigate(`/mindmap/${created.data.id}`);
    }catch{ setToast({ text:"No se pudo duplicar", kind:"err" }); }
    finally{ fetchList(); }
  };

  const onExport = async (item)=>{
    try{ const { data } = await api.get(`/mindmaps/${item.id}/export/mermaid`); setExportText(data?.mermaid||""); setExportOpen(true); }
    catch{ setToast({ text:"No se pudo exportar Mermaid", kind:"err" }); }
  };

  const onPublish = async (item)=>{
    if(!window.confirm("Se creará un Proyecto con documento inicial. ¿Continuar?")) return;
    try{
      const { data } = await api.post(`/mindmaps/${item.id}/publish`);
      setToast({ text:"Publicado como proyecto", kind:"ok" });
      if (data?.project_id) navigate(`/projects/${data.project_id}`);
    }catch{ setToast({ text:"No se pudo publicar", kind:"err" }); }
  };

  const onDelete = (item)=>{ setConfirmTarget(item); setConfirmOpen(true); };
  const applyDelete = async ()=>{
    try{
      await api.delete(`/mindmaps/${confirmTarget.id}`);
      if (activeId === confirmTarget.id) navigate("/mindmap");
      setToast({ text:"Mapa eliminado", kind:"ok" });
    }catch{ setToast({ text:"No se pudo eliminar", kind:"err" }); }
    finally{ setConfirmOpen(false); setConfirmTarget(null); fetchList(); }
  };

  const filtered = useMemo(()=> {
    let arr = items;
    if (tab !== "all") arr = arr.filter(m => m.status === tab);
    if (qDeb.trim()) arr = arr.filter(m => (m.title||"").toLowerCase().includes(qDeb.toLowerCase()));
    return arr;
  }, [items, tab, qDeb]);

  return (
    <div className="h-full grid grid-cols-12 gap-4">
      <aside className="col-span-3 flex flex-col border border-white/10 rounded-lg">
        <div className="p-3 border-b border-white/10 flex items-center gap-2">
          <div className="font-semibold text-white/90">Mis Mapas</div>
          <div className="ml-auto flex gap-2">
            <button onClick={fetchList} className="text-sm px-2 py-1 rounded bg-white/10 hover:bg-white/20" title="Actualizar">↻</button>
            <button onClick={onCreate} disabled={creating} className="text-sm px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white">
              {creating ? "Creando…" : "Nuevo"}
            </button>
          </div>
        </div>
        <div className="p-3 border-b border-white/10">
          <div className="flex gap-2">
            {["all","draft","published"].map(k=>(
              <button key={k} onClick={()=>setTab(k)} className={cx("text-xs px-2 py-1 rounded", tab===k?"bg-white/20 text-white":"bg-white/10 text-white/80 hover:bg-white/15")}>
                {k==="all"?"Todos":k==="draft"?"Borradores":"Publicados"}
              </button>
            ))}
          </div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar…" className="mt-2 w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-sm"/>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {loading && <div className="text-sm text-white/60">Cargando…</div>}
          {!loading && filtered.length===0 && <div className="text-sm text-white/50">No hay mapas. Crea uno nuevo.</div>}
          {filtered.map(m=>(
            <MapCard key={m.id} item={m} active={m.id===activeId}
              onOpen={onOpen} onRename={onRename} onDuplicate={onDuplicate} onExport={onExport} onPublish={onPublish} onDelete={onDelete}/>
          ))}
        </div>
      </aside>

      <section className="col-span-9 border border-white/10 rounded-lg overflow-hidden">
        {activeId ? <MindMapView mindmapId={activeId} /> : <div className="h-full grid place-items-center text-white/60">Selecciona o crea un mapa</div>}
      </section>

      {/* Renombrar */}
      <Modal open={renameOpen} title="Renombrar mapa" onClose={()=>setRenameOpen(false)}
        actions={<div className="flex justify-end gap-2"><button className="px-3 py-1 rounded border" onClick={()=>setRenameOpen(false)}>Cancelar</button><button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={applyRename}>Guardar</button></div>}>
        <input className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10 text-white" value={renameText} onChange={e=>setRenameText(e.target.value)} placeholder="Nuevo nombre"/>
      </Modal>

      {/* Export */}
      <Modal open={exportOpen} title="Mermaid (copiado al portapapeles)" onClose={()=>setExportOpen(false)}
        actions={<div className="flex justify-end"><button className="px-3 py-1 rounded bg-black text-white" onClick={()=>setExportOpen(false)}>Cerrar</button></div>}>
        <pre className="max-h-[50vh] overflow-auto text-xs bg-gray-950 border border-white/10 rounded p-2 text-white/90">
{exportText || "graph TD\n%% vacío"}
        </pre>
      </Modal>

      {/* Eliminar */}
      <Modal open={confirmOpen} title="Eliminar mapa" onClose={()=>setConfirmOpen(false)}
        actions={<div className="flex justify-end gap-2"><button className="px-3 py-1 rounded border" onClick={()=>setConfirmOpen(false)}>Cancelar</button><button className="px-3 py-1 rounded bg-red-600 text-white" onClick={applyDelete}>Eliminar</button></div>}>
        <p className="text-white/80 text-sm">Esta acción no se puede deshacer. ¿Seguro que quieres eliminar este mapa?</p>
      </Modal>

      <Toast text={toast.text} kind={toast.kind} onClose={()=>setToast({text:"",kind:"ok"})}/>
    </div>
  );
}
