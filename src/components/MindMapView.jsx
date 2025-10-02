// src/components/MindMapView.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import api from "../api/axios";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  addEdge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

/* ------------------------------ helpers ------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/** Backend espera nodes:{id,label,data}, edges:{source_id/target_id || source/target,data} */
function toBackendPayload(nodes, edges) {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      label: (n.data?.label ?? "Idea").trim(),
      // guardamos metadatos UI (tipos/props) en data
      data: { ...(n.data || {}), position: n.position },
    })),
    edges: edges.map((e) => ({
      // toleramos ambos nombres en back
      source_id: e.source,
      target_id: e.target,
      data: { ...(e.data || {}), label: e.label ?? e.data?.label ?? "" },
    })),
  };
}

/** Layout simple en grilla si falta position */
function layoutIfMissingPosition(rawNodes) {
  const COLS = 4,
    CW = 260,
    RH = 160,
    PADX = 40,
    PADY = 40;
  return rawNodes.map((n, i) => {
    const hasXY =
      n.position && typeof n.position.x === "number" && typeof n.position.y === "number";
    const pos = hasXY
      ? n.position
      : { x: PADX + (i % COLS) * CW, y: PADY + Math.floor(i / COLS) * RH };
    return { ...n, position: pos };
  });
}

/** Export a Mermaid (graph TD) */
function toMermaid(nodes, edges) {
  if (!nodes?.length) return "graph TD\n  %% vacío";
  const alias = new Map();
  const lines = ["graph TD"];
  nodes.forEach((n, idx) => {
    const id = `N${idx + 1}`;
    alias.set(n.id, id);
    const title = (n.data?.label || "Idea").replace(/"/g, '\\"');
    const typ = n.data?.type || "note";
    const shape =
      typ === "decision"
        ? `{"${title}"}`
        : typ === "milestone"
        ? `(("${title}"))`
        : `["${title}"]`;
    lines.push(`  ${id}${shape}`);
  });
  edges.forEach((e) => {
    const s = alias.get(e.source);
    const t = alias.get(e.target);
    if (!s || !t) return;
    const lbl = (e.label || e.data?.label || "").trim();
    lines.push(lbl ? `  ${s} -- ${lbl} --> ${t}` : `  ${s} --> ${t}`);
  });
  return lines.join("\n");
}

/** debounce */
function useDebounced(fn, delay = 600) {
  const ref = useRef();
  return useCallback(
    (...args) => {
      clearTimeout(ref.current);
      ref.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

/* ------------------------------ Node components ------------------------------ */

const baseCard =
  "rounded-xl border border-white/10 bg-gray-900/85 shadow-sm px-3 py-2 text-xs text-white/90";

function NodeChrome({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="text-[10px] uppercase tracking-wide text-white/50">{subtitle}</div>
      <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
    </div>
  );
}

function NoteNode({ data }) {
  return (
    <div className={`${baseCard} w-[220px]`}>
      <NodeChrome subtitle="Nota" />
      <div className="font-medium text-white/90">{data?.label || "Idea"}</div>
      {data?.desc ? <div className="mt-1 text-white/60">{data.desc}</div> : null}
    </div>
  );
}
function DecisionNode({ data }) {
  return (
    <div className={`${baseCard} w-[240px] border-purple-500/30`}>
      <NodeChrome subtitle="Decisión" />
      <div className="font-semibold text-purple-300">{data?.label || "¿Decidir?"}</div>
      <div className="mt-1 text-white/60">{data?.criteria || "Sí / No"}</div>
    </div>
  );
}
function SwimlaneNode({ data }) {
  return (
    <div className={`${baseCard} w-[320px] bg-gray-950/60 border-dashed`}>
      <NodeChrome subtitle="Swimlane" />
      <div className="font-medium text-white/80">{data?.label || "Grupo"}</div>
      <div className="text-[10px] text-white/40">Solo UI (no afecta export)</div>
    </div>
  );
}
function MilestoneNode({ data }) {
  return (
    <div className={`${baseCard} w-[220px] border-amber-500/30`}>
      <NodeChrome subtitle="Hito" />
      <div className="font-semibold text-amber-300">{data?.label || "Hito"}</div>
      <div className="mt-1 text-white/60">{data?.date || "Fecha por definir"}</div>
    </div>
  );
}
function ServiceNode({ data }) {
  return (
    <div className={`${baseCard} w-[260px] border-cyan-500/30`}>
      <NodeChrome subtitle="Servicio/API" />
      <div className="font-semibold text-cyan-300">{data?.label || "Servicio"}</div>
      {data?.method || data?.baseUrl ? (
        <div className="mt-1 text-white/60">
          {data?.method || "GET"} {data?.baseUrl || "/api"}
        </div>
      ) : null}
    </div>
  );
}
function KPINode({ data }) {
  const v = clamp(Number(data?.value ?? 0), 0, 100);
  return (
    <div className={`${baseCard} w-[220px] border-emerald-500/30`}>
      <NodeChrome subtitle="KPI" />
      <div className="font-medium">{data?.label || "KPI"}</div>
      <div className="mt-1 h-2 w-full bg-white/10 rounded">
        <div
          className="h-2 bg-emerald-500/80 rounded"
          style={{ width: `${v}%`, transition: "width .2s" }}
        />
      </div>
      <div className="text-[10px] text-white/60 mt-1">{v}%</div>
    </div>
  );
}

const nodeTypes = {
  note: NoteNode,
  decision: DecisionNode,
  swimlane: SwimlaneNode,
  milestone: MilestoneNode,
  service: ServiceNode,
  kpi: KPINode,
};

/* ------------------------------ Main ------------------------------ */

export default function MindMapView({ mindmapId }) {
  const [title, setTitle] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const undoRef = useRef([]);
  const redoRef = useRef([]);

  const pushUndo = useCallback(
    (snapshot) => {
      undoRef.current.push(snapshot);
      if (undoRef.current.length > 40) undoRef.current.shift();
      redoRef.current = [];
    },
    [undoRef, redoRef]
  );

  const snapshot = useCallback(
    () => ({ title, nodes: structuredClone(nodes), edges: structuredClone(edges) }),
    [title, nodes, edges]
  );

  /** Carga inicial */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError("");
        const { data } = await api.get(`/mindmaps/${mindmapId}`);
        if (!active) return;

        setTitle(data?.title || "Mapa sin título");

        // Normalizamos nodos/edges del backend
        const inNodes =
          (data?.nodes || []).map((n) => ({
            id: String(n.id || uuid()),
            type: n.data?.type || "note",
            data: { ...(n.data || {}), label: n.label || n.data?.label || "Idea" },
            position: n.data?.position || { x: 0, y: 0 },
          })) || [];

        const inEdges =
          (data?.edges || []).map((e) => ({
            id: String(e.id || uuid()),
            source: String(e.source_id || e.source),
            target: String(e.target_id || e.target),
            data: e.data || {},
            label: e.data?.label || "",
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          })) || [];

        setNodes(layoutIfMissingPosition(inNodes));
        setEdges(inEdges);
        pushUndo({ title: data?.title, nodes: inNodes, edges: inEdges });
      } catch (e) {
        setError("No se pudo cargar el mapa mental.");
      }
    })();
    return () => {
      active = false;
    };
  }, [mindmapId]);

  /** onConnect */
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          },
          eds
        )
      ),
    []
  );

  /** Guardar (debounced) */
  const doSave = useCallback(
    async (silent = false) => {
      try {
        setSaving(!silent);
        const payload = {
          title,
          status: "draft",
          ...toBackendPayload(nodes, edges),
        };
        await api.put(`/mindmaps/${mindmapId}`, payload);
        if (!silent) setInfo("✅ Guardado");
      } catch (e) {
        setError("No se pudo guardar el mapa.");
      } finally {
        setSaving(false);
        if (!silent) await sleep(1200), setInfo("");
      }
    },
    [mindmapId, title, nodes, edges]
  );

  const debouncedSave = useDebounced(doSave, 700);

  const onNodesChangeWrap = useCallback(
    (chs) => {
      onNodesChange(chs);
      debouncedSave(true);
    },
    [onNodesChange, debouncedSave]
  );
  const onEdgesChangeWrap = useCallback(
    (chs) => {
      onEdgesChange(chs);
      debouncedSave(true);
    },
    [onEdgesChange, debouncedSave]
  );

  /** Acciones de toolbar */
  const addNode = useCallback(
    (type = "note") => {
      const id = uuid();
      const x = 80 + Math.random() * 320;
      const y = 80 + Math.random() * 160;
      const label =
        type === "decision"
          ? "¿Decisión?"
          : type === "milestone"
          ? "Hito"
          : type === "service"
          ? "Servicio"
          : type === "kpi"
          ? "Indicador"
          : type === "swimlane"
          ? "Swimlane"
          : "Idea";
      setNodes((nds) =>
        nds.concat({
          id,
          type,
          position: { x, y },
          data: { label },
        })
      );
      debouncedSave(true);
    },
    [debouncedSave]
  );

  const expandIA = useCallback(async () => {
    const prompt = window.prompt(
      "¿Sobre qué quieres que la IA expanda el mapa?",
      "Arquitectura de pagos"
    );
    if (!prompt) return;
    try {
      setInfo("🤖 Generando ideas…");
      await api.post(`/mindmaps/${mindmapId}/ai/expand`, { prompt });
      // recarga rápida
      const { data } = await api.get(`/mindmaps/${mindmapId}`);
      const inNodes =
        (data?.nodes || []).map((n) => ({
          id: String(n.id || uuid()),
          type: n.data?.type || "note",
          data: { ...(n.data || {}), label: n.label || n.data?.label || "Idea" },
          position: n.data?.position || { x: 0, y: 0 },
        })) || [];
      const inEdges =
        (data?.edges || []).map((e) => ({
          id: String(e.id || uuid()),
          source: String(e.source_id || e.source),
          target: String(e.target_id || e.target),
          data: e.data || {},
          label: e.data?.label || "",
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        })) || [];
      setNodes(layoutIfMissingPosition(inNodes));
      setEdges(inEdges);
      setInfo("✅ Listo");
    } catch (e) {
      setError("No se pudo expandir con IA.");
    } finally {
      await sleep(1200);
      setInfo("");
    }
  }, [mindmapId]);

  const publish = useCallback(async () => {
    if (!window.confirm("Se creará un Proyecto con un documento inicial. ¿Continuar?")) return;
    try {
      setInfo("⬆️ Publicando…");
      const { data } = await api.post(`/mindmaps/${mindmapId}/publish`);
      const pid = data?.project_id || data?.id;
      if (pid) window.location.href = `/projects/${pid}`;
      else throw new Error("Sin project_id");
    } catch {
      setError("No se pudo publicar el proyecto.");
    } finally {
      await sleep(1200);
      setInfo("");
    }
  }, [mindmapId]);

  const undo = useCallback(() => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    redoRef.current.push(snapshot());
    setTitle(prev.title || "");
    setNodes(layoutIfMissingPosition(prev.nodes || []));
    setEdges(prev.edges || []);
  }, [snapshot]);

  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next) return;
    undoRef.current.push(snapshot());
    setTitle(next.title || "");
    setNodes(layoutIfMissingPosition(next.nodes || []));
    setEdges(next.edges || []);
  }, [snapshot]);

  const doLayout = useCallback(() => {
    setNodes((nds) => layoutIfMissingPosition(nds));
    debouncedSave(true);
  }, [debouncedSave]);

  const copyMermaid = useCallback(async () => {
    const mermaid = toMermaid(nodes, edges);
    try {
      await navigator.clipboard.writeText(mermaid);
      setInfo("📝 Mermaid copiado");
    } catch {
      setInfo("📝 Mermaid listo (no se pudo copiar automáticamente)");
      console.log(mermaid);
    } finally {
      await sleep(1200);
      setInfo("");
    }
  }, [nodes, edges]);

  /* ------------------------------ render ------------------------------ */

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => doSave(true)}
          className="bg-transparent border border-white/10 rounded px-3 py-1 text-sm w-[320px]"
          placeholder="Título del mapa"
        />
        <div className="flex gap-1">
          <button className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20" onClick={() => addNode("note")}>
            + Nota
          </button>
          <button className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20" onClick={() => addNode("decision")}>
            + Decisión
          </button>
          <button className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20" onClick={() => addNode("milestone")}>
            + Hito
          </button>
          <button className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20" onClick={() => addNode("service")}>
            + Servicio
          </button>
          <button className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20" onClick={() => addNode("kpi")}>
            + KPI
          </button>
          <button className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20" onClick={() => addNode("swimlane")}>
            + Swimlane
          </button>
        </div>

        <div className="ml-auto flex gap-2">
          <button className="px-2 py-1 text-xs rounded bg-indigo-600 text-white disabled:opacity-50" disabled={saving} onClick={() => doSave()}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20" onClick={undo}>
            Undo
          </button>
          <button className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20" onClick={redo}>
            Redo
          </button>
          <button className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20" onClick={doLayout}>
            Auto-layout
          </button>
          <button className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20" onClick={copyMermaid}>
            Copiar Mermaid
          </button>
          <button className="px-2 py-1 text-xs rounded bg-emerald-600 text-white" onClick={expandIA}>
            Expandir IA
          </button>
          <button className="px-2 py-1 text-xs rounded bg-rose-600 text-white" onClick={publish}>
            Publicar
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChangeWrap}
          onEdgesChange={onEdgesChangeWrap}
          onConnect={onConnect}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>

      {/* status line */}
      {error ? (
        <div className="px-3 py-1 text-red-400 text-sm border-t border-white/10">{error}</div>
      ) : info ? (
        <div className="px-3 py-1 text-emerald-400 text-sm border-t border-white/10">{info}</div>
      ) : null}
    </div>
  );
}