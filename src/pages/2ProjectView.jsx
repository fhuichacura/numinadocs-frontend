// src/pages/ProjectView.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ----------------------- util UI helpers ----------------------- */
const StatCard = ({ title, value, sub }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
    <div className="text-sm text-zinc-400">{title}</div>
    <div className="text-2xl font-bold text-white mt-1">{value}</div>
    {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
  </div>
);
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="p-3"><div className="h-4 w-48 bg-zinc-800 rounded" /></td>
    <td className="p-3"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
    <td className="p-3"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
    <td className="p-3 text-right"><div className="h-8 w-20 ml-auto bg-zinc-800 rounded" /></td>
  </tr>
);

/* ----------------------- Export PDF (branding) ----------------------- */
function ExportPdfButton({ scope = ".ndoc-export-scope", filename = "documento" }) {
  const onExport = async () => {
    const node = document.querySelector(scope);
    if (!node) return;
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#0d1117" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // header
    pdf.setFillColor(18, 18, 24);
    pdf.rect(0, 0, pageW, 56, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.text("NuminaDocs · n100f", 36, 34);

    // body con paginado
    const margin = 24, usableW = pageW - margin*2;
    const ratio = canvas.height/canvas.width;
    const imgW = usableW, imgH = imgW * ratio;
    let y = 70;
    if (imgH <= pageH - y - 60) {
      pdf.addImage(img, "PNG", margin, y, imgW, imgH, "", "FAST");
    } else {
      let remaining = imgH, sy = 0, sliceH = pageH - y - 60;
      while (remaining > 0) {
        pdf.addImage(img, "PNG", margin, y, imgW, imgH, "", "FAST", 0, sy/imgH, 1, sliceH/imgH);
        remaining -= sliceH; sy += sliceH;
        if (remaining > 0) {
          pdf.addPage();
          pdf.setFillColor(18, 18, 24); pdf.rect(0,0,pageW,56,"F");
          pdf.setTextColor(255,255,255); pdf.setFontSize(12);
          pdf.text("NuminaDocs · n100f", 36, 34);
        }
      }
    }
    // footer
    const fy = pageH - 28;
    pdf.setDrawColor(139, 92, 246); pdf.setLineWidth(0.6);
    pdf.line(36, fy-12, pageW-36, fy-12);
    pdf.setTextColor(139, 92, 246); pdf.setFontSize(10);
    pdf.text("Documento generado por NuminaDocs · confidencial", 36, fy);
    pdf.save(`${filename.replace(/\s+/g, "_")}.pdf`);
  };
  return (
    <button onClick={onExport} className="px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 font-semibold">
      Exportar PDF
    </button>
  );
}

/* ----------------------- Audio Recorder mini ----------------------- */
function AudioRecorder({ onBlob }) {
  const [rec, setRec] = useState(false);
  const [err, setErr] = useState("");
  const mrRef = useRef(null); const chunksRef = useRef([]);
  const start = async () => {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream); mrRef.current = mr; chunksRef.current = [];
      mr.ondataavailable = (e)=>e.data.size && chunksRef.current.push(e.data);
      mr.onstop = ()=>{ onBlob(new Blob(chunksRef.current,{type:"audio/webm"})); stream.getTracks().forEach(t=>t.stop()); };
      mr.start(); setRec(true);
    } catch { setErr("No se pudo acceder al micrófono."); }
  };
  const stop = () => { if (mrRef.current?.state!=="inactive") mrRef.current.stop(); setRec(false); };
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 min-w-0">
      <div className="text-sm text-zinc-300 mb-2">Grabar Audio (minutas rápidas)</div>
      <div className="flex flex-wrap items-center gap-3">
        {!rec ? (
          <button onClick={start} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">Iniciar</button>
        ) : (
          <button onClick={stop} className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">Detener</button>
        )}
        {err && <span className="text-xs text-red-400">{err}</span>}
      </div>
      <p className="text-[11px] text-zinc-500 mt-2">La IA puede transcribirlo y convertirlo en acta.</p>
    </div>
  );
}

/* ----------------------- Modal de Actas ----------------------- */
function MinutesModal({ open, onClose, projectId, meeting, token, onSaved }) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [saved, setSaved] = useState(null);

  const transcribe = async () => {
    if (!audioBlob) return;
    setBusy(true); setMsg("Transcribiendo audio con IA…");
    try {
      const fd = new FormData();
      fd.append("file", audioBlob, `meeting-${meeting.id}-${Date.now()}.webm`);
      const r = await apiClient.post(`/ai/transcribe`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      }).catch(()=>({ data:{ text:"" }}));
      const text = r?.data?.text || "";
      setNotes(n => (n ? `${n}\n\n${text}` : text));
      setMsg("Transcripción añadida.");
    } finally { setBusy(false); }
  };

  const structureWithAI = async () => {
    if (!notes.trim()) return;
    setBusy(true); setMsg("Estructurando acta (resumen / acuerdos / pendientes)…");
    try {
      const res = await apiClient.post(`/ai-actions/`, {
        action: "minutes_structure", text: notes
      }, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>({ data:{ generated_text:notes }}));
      setNotes(res?.data?.generated_text || notes);
      setMsg("Acta estructurada.");
    } finally { setBusy(false); }
  };

  const saveAll = async () => {
    if (!notes.trim() && !audioBlob) return;
    setBusy(true); setMsg("Guardando acta y ejecutando automatizaciones…");
    try {
      // 1) Guardar acta (adjunta audio si hay)
      let minutes;
      if (audioBlob) {
        const fd = new FormData();
        fd.append("notes", notes); fd.append("audio", audioBlob, `meeting-${meeting.id}.webm`);
        const res = await apiClient.post(`/projects/${projectId}/meetings/${meeting.id}/minutes`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        }).catch(()=>({ data:{ minutes:{ notes }}}));
        minutes = res?.data?.minutes || { notes };
      } else {
        const res = await apiClient.post(`/projects/${projectId}/meetings/${meeting.id}/minutes`, { notes }, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(()=>({ data:{ minutes:{ notes }}}));
        minutes = res?.data?.minutes || { notes };
      }
      setSaved(minutes);

      // 2) Indexado semántico por secciones (stub seguro)
      await apiClient.post(`/ai/semantic_index`, {
        project_id: projectId, resource_type: "minutes", resource_id: meeting.id, text: notes
      }, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});

      // 3) Crear acciones desde pendientes tipo checklist (stub)
      const actionRegex = /(?:^|\n)[\-\*]\s*\[(?:\s|x)?\]\s*(.+?)(?:\s*\(resp:\s*(.+?)\s*,\s*venc:\s*([^)]+)\))?/gi;
      const items = []; let m;
      while ((m = actionRegex.exec(notes)) !== null) items.push({ title: m[1], owner: m[2] || null, due_date: m[3] || null, lane: "backlog" });
      if (items.length) {
        await apiClient.post(`/projects/${projectId}/actions/bulk`, { meeting_id: meeting.id, items }, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(()=>{});
      }

      // 4) Auto-agenda (webhook a Calendar o ICS) (stub)
      await apiClient.post(`/calendar/events`, {
        project_id: projectId, meeting_id: meeting.id, title: meeting.title, date: meeting.date
      }, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});

      onSaved?.(); setMsg("Acta guardada.");
    } finally { setBusy(false); setTimeout(()=>setMsg(""),1800); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center">
      <div className="w-[98%] max-w-[1100px] bg-[#0f172a] border border-[#27272a] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-zinc-400">Acta de reunión</div>
            <h3 className="text-2xl font-bold text-white truncate">{meeting?.title || "Reunión"}</h3>
            <div className="text-xs text-zinc-500">{new Date(meeting?.date).toLocaleString()}</div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {saved && <ExportPdfButton scope=".minutes-export" filename={`Acta_${meeting?.title||"reunion"}`} />}
            <button onClick={onClose} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg">Cerrar</button>
          </div>
        </div>

        {/* captura + transcripción */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm text-zinc-300 mb-2">Captura rápida</div>
            <AudioRecorder onBlob={setAudioBlob} />
            <div className="mt-3">
              <button onClick={transcribe} disabled={!audioBlob || busy} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">
                Transcribir Audio
              </button>
              {audioBlob && <span className="ml-3 text-xs text-zinc-400">Audio listo ({Math.round(audioBlob.size/1024)} KB)</span>}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 minutes-export">
            <div className="text-sm text-zinc-300 mb-2">Borrador del acta</div>
            <textarea
              value={notes}
              onChange={(e)=>setNotes(e.target.value)}
              placeholder={`Estructura sugerida:
• Resumen
• Asistentes
• Acuerdos
• Pendientes [ ] Tarea (resp: Nombre, venc: 2025-09-01)
• Próximos pasos`}
              className="w-full h-56 p-3 bg-zinc-900 rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-purple-300">{msg}</div>
          <div className="flex items-center gap-2">
            <button onClick={structureWithAI} disabled={busy || !notes.trim()} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">✨ Estructurar con IA</button>
            <button onClick={saveAll} disabled={busy || (!notes.trim() && !audioBlob)} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">Guardar Acta</button>
          </div>
        </div>

        {saved && (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm text-emerald-400 mb-2">Última versión guardada</div>
            <pre className="whitespace-pre-wrap text-sm text-zinc-300">{saved.notes}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------- Panel de Reuniones ----------------------- */
function MeetingPanel({ projectId, token }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    const res = await apiClient.get(`/projects/${projectId}/meetings`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(()=>({ data:[] }));
    setItems(res.data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [projectId, token]);

  const add = async () => {
    if (!title.trim() || !date) return;
    setBusy(true);
    await apiClient.post(`/projects/${projectId}/meetings`, { title: title.trim(), date }, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(()=>{});
    setTitle(""); setDate(""); await load(); setBusy(false);
    setMsg("Reunión agendada."); setTimeout(()=>setMsg(""),1500);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-white">Reuniones</div>
        <div className="text-xs text-purple-300">{msg}</div>
      </div>

      {/* Agenda rápida responsive */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          value={title} onChange={(e)=>setTitle(e.target.value)}
          placeholder="Título de la reunión"
          className="flex-1 min-w-0 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm"
        />
        <input
          type="datetime-local" value={date} onChange={(e)=>setDate(e.target.value)}
          className="min-w-0 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm"
        />
        <button onClick={add} disabled={busy} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">
          Agendar
        </button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-zinc-500">Sin reuniones agendadas.</div>
        ) : items
          .sort((a,b)=>new Date(a.date)-new Date(b.date))
          .map(m => (
          <div key={m.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-medium text-zinc-200 truncate">{m.title}</div>
              <div className="text-xs text-zinc-500">{new Date(m.date).toLocaleString()}</div>
              {m.minutes && <div className="text-xs text-emerald-400 mt-1">Acta generada</div>}
            </div>
            <div className="shrink-0">
              <button onClick={()=>{ setSelected(m); setOpen(true); }} className="text-xs px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white">
                Acta
              </button>
            </div>
          </div>
        ))}
      </div>

      <MinutesModal
        open={open}
        onClose={()=>{ setOpen(false); setSelected(null); }}
        projectId={projectId}
        meeting={selected}
        token={token}
        onSaved={load}
      />
    </div>
  );
}

/* ----------------------- RAW: Modal subida ----------------------- */
function UploadRawModal({ open, onClose, onUploaded, projectId, token }) {
  const [files, setFiles] = useState([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const el = dropRef.current; if (!el) return;
    const prevent = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    const onDrop = (e) => {
      prevent(e); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files || [])]);
    };
    el.addEventListener("dragover", prevent); el.addEventListener("drop", onDrop);
    return () => { el.removeEventListener("dragover", prevent); el.removeEventListener("drop", onDrop); };
  }, [open]);

  const uploadFormData = (fd) =>
    apiClient.post(`/projects/${projectId}/raw`, fd, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type":"multipart/form-data" },
    });

  const handleUpload = async () => {
    if ((!files || !files.length) && !note.trim()) return;
    setBusy(true);
    try {
      if (note.trim()) {
        const fd = new FormData();
        fd.append("file", new Blob([note.trim()], { type: "text/plain" }), `note-${Date.now()}.txt`);
        await uploadFormData(fd).catch(()=>{});
      }
      for (const f of files) { const fd = new FormData(); fd.append("file", f); await uploadFormData(fd).catch(()=>{}); }
      onUploaded?.(); onClose?.(); setFiles([]); setNote("");
    } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center">
      <div className="w-[98%] max-w-[1100px] bg-[#0f172a] border border-[#27272a] rounded-2xl p-6 shadow-2xl">
        <h3 className="text-2xl font-bold text-white">Añadir Material RAW</h3>
        <div ref={dropRef} className="mt-3 border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center bg-zinc-900/40">
          <p className="text-sm text-zinc-400">Arrastra PDF, imágenes, audio, markdown o código. O selecciona:</p>
          <label className="inline-block mt-3 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer">
            Seleccionar archivos
            <input multiple type="file" className="hidden" onChange={(e)=>setFiles(prev=>[...prev, ...Array.from(e.target.files||[])])} />
          </label>
          {!!files.length && (
            <div className="text-left text-sm text-zinc-300 mt-4 space-y-1 max-h-36 overflow-y-auto">
              {files.map((f,i)=>(
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <span className="text-[11px] text-zinc-500">{Math.round(f.size/1024)} KB</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="text-sm text-zinc-300 mb-1">O pegar una nota / bloque de código</div>
          <textarea
            value={note} onChange={(e)=>setNote(e.target.value)}
            placeholder="Pega comandos, texto, diagramas Mermaid, etc."
            className="w-full h-28 p-3 bg-zinc-900 rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600">Cancelar</button>
          <button onClick={handleUpload} disabled={busy || (!files.length && !note.trim())} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">Subir Material</button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- VISTA PRINCIPAL ----------------------- */
export default function ProjectView() {
  const { projectId, tab } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [active, setActive] = useState(tab || "dashboard");
  const [project, setProject] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [rawItems, setRawItems] = useState([]);
  const [loadingRaw, setLoadingRaw] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [aiBusy, setAIBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState("");

  // cargar proyecto
  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const res = await apiClient.get(`/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(()=>({ data:{ id: projectId, name:"Proyecto"} }));
        setProject(res?.data || { id: projectId, name:"Proyecto" });
      } catch {
        setProject({ id: projectId, name:"Proyecto" });
      }
    })();
  }, [token, projectId]);

  // docs
  const loadDocs = async () => {
    if (!token) return;
    try {
      setLoadingDocs(true);
      const res = await apiClient.get(`/documents/by_project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data || []);
    } catch { setDocuments([]); } finally { setLoadingDocs(false); }
  };
  // raw
  const loadRaw = async () => {
    if (!token) return;
    try {
      setLoadingRaw(true);
      const res = await apiClient.get(`/projects/${projectId}/raw`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(()=>({ data:[] }));
      setRawItems(res.data || []);
    } catch { setRawItems([]); } finally { setLoadingRaw(false); }
  };
  useEffect(() => { loadDocs(); loadRaw(); /* eslint-disable-next-line */ }, [token, projectId]);
  useEffect(() => { if (tab && tab !== active) setActive(tab); /* eslint-disable-next-line */ }, [tab]);

  // transcribir audio del RAW
  const transcribeAudio = async () => {
    if (!audioBlob) return;
    setAIBusy(true); setAiMsg("Transcribiendo audio…");
    try {
      const fd = new FormData();
      fd.append("file", audioBlob, `audio-${Date.now()}.webm`);
      fd.append("project_id", projectId);
      await apiClient.post(`/ai/transcribe`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      }).catch(()=>{});
      await loadRaw(); setAudioBlob(null); setAiMsg("Transcripción agregada al RAW.");
    } finally { setAIBusy(false); setTimeout(()=>setAiMsg(""),1500); }
  };

  // IA: clasificar y generar docs desde RAW (stubs seguros)
  const categorizeRaw = async (item) => {
    setAIBusy(true); setAiMsg("Clasificando RAW…");
    try {
      await apiClient.post(`/ai/categorize`, { project_id: projectId, item_id: item.id }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(()=>{});
      setAiMsg("RAW clasificado.");
    } finally { setAIBusy(false); setTimeout(()=>setAiMsg(""),1200); }
  };
  const generateFromRaw = async (item, kind="technical") => {
    setAIBusy(true); setAiMsg("Generando documento…");
    try {
      const res = await apiClient.post(`/documents/generate_from_raw`, {
        project_id: projectId, source_item_id: item.id, doc_kind: kind
      }, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>({ data:{ id:null }}));
      const id = res?.data?.id;
      if (id) navigate(`/documents/${id}`); else { await loadDocs(); setAiMsg("Documento generado (sim)"); }
    } finally { setAIBusy(false); setTimeout(()=>setAiMsg(""),1200); }
  };

  const kpis = useMemo(() => ({ docs: documents.length, raw: rawItems.length }), [documents, rawItems]);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <Link to="/projects" className="text-sm text-purple-400 hover:text-white">&larr; Volver a Proyectos</Link>
          <h1 className="text-3xl font-bold text-white mt-1 truncate">{project?.name || "Proyecto"}</h1>
          <p className="text-sm text-zinc-400 truncate">{project?.description}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button onClick={()=>setUploadOpen(true)} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Añadir RAW</button>
          <Link to="/templates" className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Plantillas</Link>
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        {["dashboard","raw","documents","roadmap"].map(id=>(
          <button key={id} onClick={()=>setActive(id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              active===id ? "border-purple-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}>
            {id==="dashboard"?"Dashboard":id==="raw"?"Raw Vault":id==="documents"?"Documentos":"Roadmap + IA"}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {active==="dashboard" && (
        <section className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-4">
            <StatCard title="Documentos" value={kpis.docs} sub="Generados por IA y manuales"/>
            <StatCard title="Ítems RAW" value={kpis.raw} sub="Notas, audio, PDFs, código"/>
            <StatCard title="Estado" value="🟢 En Curso" sub="Fase 1 · Despliegue Inicial"/>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h3 className="text-white font-semibold mb-2">Resumen Ejecutivo</h3>
              <p className="text-zinc-400">
                Hub conforme <b>PMI/PMBOK</b>. Documentación en plantillas (HLD, LLD, Técnico, Ejecutivo, Comercial).
                La IA entiende material RAW (texto, comandos, audio, Mermaid) y lo transforma en entregables.
              </p>
            </div>
            {/* 👇 Nueva card de Reuniones, estable y responsive */}
            <MeetingPanel projectId={projectId} token={token}/>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h3 className="text-white font-semibold mb-3">Acciones Rápidas</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={()=>setActive("raw")} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">Subir Material RAW</button>
              <button onClick={()=>setActive("documents")} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Ver Documentos</button>
              <Link to="/templates" className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Explorar Plantillas</Link>
            </div>
          </div>
        </section>
      )}

      {/* RAW */}
      {active==="raw" && (
        <section className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <AudioRecorder onBlob={setAudioBlob}/>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 min-w-0">
              <div className="text-sm text-zinc-300 mb-2">Procesar Audio con IA</div>
              <div className="flex flex-wrap items-center gap-3">
                <button disabled={!audioBlob || aiBusy} onClick={transcribeAudio}
                        className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-60">
                  {aiBusy?"Procesando…":"Transcribir y Guardar en RAW"}
                </button>
                {audioBlob && <span className="text-xs text-zinc-400">Audio listo ({Math.round(audioBlob.size/1024)} KB)</span>}
              </div>
              {aiMsg && <div className="text-xs text-purple-300 mt-2">{aiMsg}</div>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Material RAW del Proyecto</h3>
            <div className="flex items-center gap-2">
              <button onClick={()=>setUploadOpen(true)} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Añadir RAW</button>
              <button onClick={loadRaw} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">↻ Refrescar</button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-0 overflow-hidden">
            <table className="w-full text-left text-zinc-300">
              <thead className="text-sm text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Tamaño</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingRaw ? (
                  <>{[...Array(3)].map((_,i)=><SkeletonRow key={i}/>)}</>
                ) : rawItems.length===0 ? (
                  <tr><td className="p-6 text-zinc-500" colSpan="4">No hay material RAW aún.</td></tr>
                ) : (
                  rawItems.map(it=>(
                    <tr key={it.id} className="border-b border-zinc-800 hover:bg-zinc-900/30">
                      <td className="p-3">
                        <span className="font-semibold text-white">{it.filename||it.name}</span>
                        {it.summary && <div className="text-xs text-zinc-500">{it.summary}</div>}
                      </td>
                      <td className="p-3">{it.mime||it.content_type||"desconocido"}</td>
                      <td className="p-3">{it.size?`${Math.round(it.size/1024)} KB`:"-"}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={()=>categorizeRaw(it)} disabled={aiBusy} className="text-xs px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700">Clasificar IA</button>
                          <button onClick={()=>generateFromRaw(it,"technical")} disabled={aiBusy} className="text-xs px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">Generar Doc (Técnico)</button>
                          <button onClick={()=>generateFromRaw(it,"executive")} disabled={aiBusy} className="text-xs px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">Minuta Ejecutiva</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Documentos */}
      {active==="documents" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Documentos del Proyecto</h3>
            <button onClick={()=>navigate(`/projects/${projectId}`)} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">＋ Generar con IA</button>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <table className="w-full text-left text-zinc-300">
              <thead className="text-sm text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="p-3">Título</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Versión</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingDocs ? (
                  <>{[...Array(3)].map((_,i)=><SkeletonRow key={i}/>)}</>
                ) : documents.length===0 ? (
                  <tr><td className="p-6 text-zinc-500" colSpan="4">Aún no hay documentos.</td></tr>
                ) : (
                  documents.map(doc=>(
                    <tr key={doc.id} className="border-b border-zinc-800 hover:bg-zinc-900/30">
                      <td className="p-3 font-semibold">
                        <Link to={`/documents/${doc.id}`} className="text-purple-400 hover:text-purple-300">{doc.title}</Link>
                      </td>
                      <td className="p-3 capitalize">{doc.document_type}</td>
                      <td className="p-3">{doc.version}</td>
                      <td className="p-3 text-right">
                        <Link to={`/documents/${doc.id}`} className="text-xs px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700">Abrir</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Roadmap + IA (kanban) */}
      {active==="roadmap" && (
        <section className="space-y-6">
          {/* Si ya tienes tu RoadmapBoard modular, impórtalo; aquí lo dejamos placeholder si no. */}
          {/* <RoadmapBoard projectId={projectId} token={token}/> */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-zinc-400">
            <p>Kanban inteligente con IA. (Si ya pegaste RoadmapBoard, descomenta la línea anterior).</p>
          </div>
        </section>
      )}

      {/* Modal RAW */}
      <UploadRawModal
        open={uploadOpen}
        onClose={()=>setUploadOpen(false)}
        onUploaded={()=>{ loadRaw(); setActive("raw"); }}
        projectId={projectId}
        token={token}
      />
    </div>
  );
}