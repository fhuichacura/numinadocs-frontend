// src/pages/project/tabs/DashboardTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import { meetingsApi } from "../../../api/meetings";
import { rawApi } from "../../../api/raw";
import { documentsApi } from "../../../api/documents";
import { Link } from "react-router-dom";

/* ---------- UI atomics ---------- */
const StatCard = ({ title, value, sub }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
    <div className="text-sm text-zinc-400">{title}</div>
    <div className="text-2xl font-bold text-white mt-1">{value}</div>
    {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
  </div>
);

const LineItem = ({ title, meta, href }) => (
  <div className="flex items-center justify-between py-2">
    <div className="min-w-0">
      <div className="text-sm text-zinc-200 truncate">{title}</div>
      {meta && <div className="text-[11px] text-zinc-500 truncate">{meta}</div>}
    </div>
    {href ? (
      <Link to={href} className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700">
        Abrir
      </Link>
    ) : null}
  </div>
);

/* ---------- Progress card ---------- */
const ProgressCard = ({ percent, label = "Progreso del Proyecto" }) => {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const color =
    pct >= 80 ? "bg-emerald-500" :
    pct >= 50 ? "bg-amber-400" :
    "bg-purple-600";
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">{label}</div>
        <div className="text-sm text-zinc-300">{pct}%</div>
      </div>
      <div className="mt-3 h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-2.5 ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 text-[11px] text-zinc-500">
        Calculado desde acuerdos/pendientes cerrados en tus últimas actas.
      </div>
    </div>
  );
};

/* ---------- helpers ---------- */
function buildMinutesDigest(meetings) {
  // últimas 2 actas con notas
  const latest = meetings
    .filter(m => !!m.minutes?.notes)
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .slice(0, 2);

  const acuerdos = [];
  const pendientes = [];

  // - [x] hecho  /  - [ ] pendiente   (+ resp:, venc:)
  const re = /(?:^|\n)[\-\*]\s*\[(x|\s)?\]\s*(.+?)(?:\s*\(resp:\s*(.+?)\s*,\s*venc:\s*([^)]+)\))?/gi;
  for (const m of latest) {
    let match;
    while ((match = re.exec(m.minutes.notes)) !== null) {
      const done = (match[1] || "").toLowerCase() === "x";
      const title = match[2];
      const owner = match[3] || "N/A";
      const due = match[4] || "sin fecha";
      const item = { title, owner, due, meeting: m.title };
      done ? acuerdos.push(item) : pendientes.push(item);
    }
  }
  return { acuerdos, pendientes };
}

function buildRecentActivity(raw, docs, meets) {
  const map = [];

  raw.slice(0, 6).forEach(r => {
    map.push({
      type: "RAW",
      title: r.filename || r.name,
      meta: r.mime || "desconocido",
      href: null,
      ts: r.created_at ? new Date(r.created_at) : new Date(),
    });
  });
  docs.slice(0, 6).forEach(d => {
    map.push({
      type: "DOC",
      title: d.title,
      meta: `Versión ${d.version} · ${d.document_type}`,
      href: `/documents/${d.id}`,
      ts: d.updated_at ? new Date(d.updated_at) : new Date(),
    });
  });
  meets
    .filter(m => !!m.minutes?.notes)
    .slice(0, 6)
    .forEach(m => {
      map.push({
        type: "ACTA",
        title: `Acta · ${m.title}`,
        meta: new Date(m.date).toLocaleString(),
        href: null,
        ts: new Date(m.date),
      });
    });

  return map.sort((a, b) => b.ts - a.ts).slice(0, 8);
}

/* ---------- DASHBOARD TAB ---------- */
export default function DashboardTab({ project, token }) {
  const projectId = project?.id;

  const [docs, setDocs] = useState([]);
  const [raw, setRaw] = useState([]);
  const [meets, setMeets] = useState([]);
  const [loading, setLoading] = useState(true);

  // KPIs simples
  const kpis = useMemo(() => ({
    docs: docs.length,
    raw: raw.length,
    estado: "🟢 En Curso",
  }), [docs, raw]);

  // Resumen inteligente y progreso
  const digest = useMemo(() => buildMinutesDigest(meets), [meets]);
  const progressPct = useMemo(() => {
    const done = digest.acuerdos.length;
    const pend = digest.pendientes.length;
    const total = done + pend;
    if (!total) return 0;
    return (done / total) * 100;
  }, [digest]);

  // Actividad y próximas reuniones
  const recent = useMemo(() => buildRecentActivity(raw, docs, meets), [raw, docs, meets]);
  const upcoming = useMemo(
    () => meets
      .filter(m => !m.minutes?.notes)
      .sort((a,b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5),
    [meets]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [d1, d2, d3] = await Promise.all([
        documentsApi.listByProject(projectId, token),
        rawApi.list(projectId, token),
        meetingsApi.list(projectId, token),
      ]);
      if (alive) {
        setDocs(Array.isArray(d1) ? d1 : []);
        setRaw(Array.isArray(d2) ? d2 : []);
        setMeets(Array.isArray(d3) ? d3 : []);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [projectId, token]);

  return (
    <section className="space-y-6">
      {/* KPIs + Progreso */}
      <div className="grid 2xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-4">
        <StatCard title="Documentos" value={kpis.docs} sub="Generados por IA y manuales" />
        <StatCard title="Ítems RAW" value={kpis.raw} sub="Notas, audio, PDFs, código" />
        <StatCard title="Estado" value={kpis.estado} sub="Fase 1 · Despliegue Inicial" />
        {/* Barra de progreso que pediste */}
        <ProgressCard percent={progressPct} />
      </div>

      {/* Resumen ejecutivo */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h3 className="text-white font-semibold mb-2">Resumen Ejecutivo</h3>
        <p className="text-zinc-400">
          Hub conforme <b>PMI/PMBOK</b>. Documentación en plantillas (HLD, LLD, Técnico, Ejecutivo, Comercial).
          La IA entiende material RAW (texto, comandos, audio, Mermaid) y lo transforma en entregables.  
          Este panel concentra actividad reciente, próximas reuniones y acuerdos/pendientes de tus últimas actas.
        </p>
      </div>

      {/* Minutas & Resumen inteligente / Actividad / Próximas reuniones */}
      <div className="grid 2xl:grid-cols-3 lg:grid-cols-2 gap-4">
        {/* Minutas & Resumen Inteligente */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Minutas & Resumen Inteligente</h3>
            <Link to={`/projects/${projectId}/documents`} className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700">
              Ver documentos
            </Link>
          </div>

          {loading && <div className="text-sm text-zinc-500">Cargando…</div>}

          {!loading && digest.acuerdos.length === 0 && digest.pendientes.length === 0 && (
            <div className="text-sm text-zinc-500">Aún no hay actas. Crea una desde Reuniones.</div>
          )}

          {!loading && (digest.acuerdos.length > 0 || digest.pendientes.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold text-emerald-400 mb-2">Acuerdos</div>
                <div className="divide-y divide-zinc-800">
                  {digest.acuerdos.slice(0,5).map((a, i) => (
                    <LineItem key={`a-${i}`} title={a.title} meta={`Reunión: ${a.meeting}`} />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-amber-300 mb-2">Pendientes</div>
                <div className="divide-y divide-zinc-800">
                  {digest.pendientes.slice(0,5).map((p, i) => (
                    <LineItem key={`p-${i}`} title={p.title} meta={`Resp: ${p.owner} · Venc: ${p.due}`} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Actividad Reciente</h3>
            <button onClick={() => window.location.reload()} className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700">↻ Refrescar</button>
          </div>
          {loading && <div className="text-sm text-zinc-500">Cargando…</div>}
          {!loading && recent.length === 0 && (
            <div className="text-sm text-zinc-500">Aún no hay actividad registrada.</div>
          )}
          {!loading && recent.length > 0 && (
            <div className="divide-y divide-zinc-800">
              {recent.map((r, i) => (
                <LineItem key={`r-${i}`} title={`${r.type} · ${r.title}`} meta={r.meta} href={r.href} />
              ))}
            </div>
          )}
        </div>

        {/* Próximas reuniones */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Próximas Reuniones</h3>
            <Link to={`/projects/${projectId}/dashboard`} className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700">
              Agendar
            </Link>
          </div>
          {loading && <div className="text-sm text-zinc-500">Cargando…</div>}
          {!loading && upcoming.length === 0 && (
            <div className="text-sm text-zinc-500">No hay reuniones pendientes.</div>
          )}
          {!loading && upcoming.length > 0 && (
            <div className="divide-y divide-zinc-800">
              {upcoming.map((m) => (
                <LineItem key={m.id} title={m.title} meta={new Date(m.date).toLocaleString()} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h3 className="text-white font-semibold mb-3">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <Link to={`/projects/${projectId}/raw`} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">Subir Material RAW</Link>
          <Link to={`/projects/${projectId}/documents`} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Ver Documentos</Link>
          <Link to={`/templates`} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Explorar Plantillas</Link>
          <Link to={`/projects/${projectId}/dashboard`} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Agendar Reunión</Link>
        </div>
      </div>
    </section>
  );
}