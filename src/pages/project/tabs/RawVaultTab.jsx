// src/pages/project/tabs/RawVaultTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import RawViewerModal from "../../../components/raw/RawViewerModal";
import UploadRawModal from "../../../components/raw/UploadRawModal";
import AudioRecorder from "../../../components/raw/AudioRecorder";
import { rawApi } from "../../../api/raw";
import { documentsApi } from "../../../api/documents";
import { aiApi } from "../../../api/ai";

export default function RawVaultTab({ projectId, tokenFromParent, reloadDocs }) {
  const { token: tokenCtx } = useAuth();
  const token = tokenFromParent || tokenCtx;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");

  const [viewer, setViewer] = useState({ open: false, file: null, text: "", url: "" });
  const [uploadOpen, setUploadOpen] = useState(false);

  const [audioBlob, setAudioBlob] = useState(null);
  const [audioDur, setAudioDur] = useState(0);
  const [busy, setBusy] = useState(false);

  const canShow = useMemo(() => Boolean(projectId && token), [projectId, token]);

  const fetchList = async () => {
    if (!canShow) return;
    try {
      setLoading(true);
      setErr("");
      const data = await rawApi.list(projectId, token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setItems([]);
      setErr("No se pudo cargar el material RAW.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [projectId, token]);

  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return items;
    return items.filter((f) => {
      const name = (f.filename || "").toLowerCase();
      const mime = (f.mime || "").toLowerCase();
      const tags = JSON.stringify(f.tags || {}).toLowerCase();
      return name.includes(q) || mime.includes(q) || tags.includes(q);
    });
  }, [items, query]);

  // ======= Grabación =======
  const onRecorderStop = ({ blob, durationMs }) => {
    setAudioBlob(blob);
    setAudioDur(durationMs || 0);
  };

  const handleSaveAudioOnly = async () => {
    if (!audioBlob) return alert("No hay audio grabado.");
    try {
      setBusy(true);
      const filename = `audio-${Date.now()}.webm`;
      await rawApi.uploadBlob({
        projectId,
        blob: audioBlob,
        filename,
        mime: "audio/webm",
        token,
        tags: { type: "audio", duration_ms: audioDur }
      });
      setAudioBlob(null);
      setAudioDur(0);
      fetchList();
      alert("Audio guardado en RAW.");
    } catch (e) {
      console.error(e);
      alert(e?.message || "No se pudo guardar el audio.");
    } finally {
      setBusy(false);
    }
  };

  const handleTranscribeAndSave = async () => {
    if (!audioBlob) return alert("Primero graba un audio.");
    try {
      const createDoc = window.confirm("¿Generar documento técnico inmediatamente?");
      setBusy(true);
      const { file_id, doc_id } = await rawApi.transcribeToRaw({
        projectId, blob: audioBlob, createDoc, token
      });
      setAudioBlob(null);
      setAudioDur(0);
      await fetchList();
      if (doc_id) {
        reloadDocs && reloadDocs();
        alert(`Documento generado: ${doc_id}`);
      } else {
        alert(`Transcripción guardada (file_id: ${file_id}).`);
      }
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        (Array.isArray(e?.response?.data) ? JSON.stringify(e.response.data) : null) ||
        e?.message ||
        "No fue posible transcribir o guardar.";
      alert(msg);
    } finally {
      setBusy(false);
    }
  };

  // ======= Acciones RAW =======
  const handleClassify = async (file) => {
    try {
      const inline = (file.tags && file.tags.inline_text) || "";
      const textForModel = inline ? String(inline).slice(0, 4000) : (file.filename || "raw");
      await aiApi.actions({ action: "classify_raw", text: textForModel, meta: { file_id: file.id }, token });
      await fetchList();
      alert("Clasificación aplicada.");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || e?.message || "No fue posible clasificar el archivo.");
    }
  };

  const handleGenerate = async (file, kind = "technical") => {
    if (!file?.tags?.inline_text) return alert("Este RAW no tiene texto. Primero transcribe o añade nota.");
    try {
      setBusy(true);
      const doc = await documentsApi.generateFromRaw(projectId, file.id, kind, token);
      if (doc?.id) {
        reloadDocs && reloadDocs();
        alert(`Documento generado: ${doc.id}`);
      } else {
        alert("Respuesta inesperada del servidor.");
      }
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || e?.message || "No fue posible generar documento.");
    } finally {
      setBusy(false);
    }
  };

  const handleView = async (file) => {
    try {
      const resp = await rawApi.getContent(projectId, file.id, token, false);
      setViewer({
        open: true,
        file,
        url: resp?.url || "",
        text: typeof resp === "string" ? resp : "",
      });
    } catch (e) {
      console.error(e);
      alert("No fue posible abrir el archivo.");
    }
  };

  const handleDownload = async (file) => {
    try {
      const resp = await rawApi.getContent(projectId, file.id, token, true);
      if (resp && resp.url) {
        window.open(resp.url, "_blank", "noopener");
        return;
      }
      const mime = file.mime || "text/plain";
      const blob = new Blob([resp], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = file.filename || "raw.txt"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("No fue posible descargar el archivo.");
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`¿Eliminar "${file.filename}"?`)) return;
    try {
      await rawApi.del(projectId, file.id, token);
      fetchList();
    } catch (e) {
      console.error(e);
      alert("No fue posible eliminar.");
    }
  };

  return (
    <div className="space-y-6">
      {/* cabecera: grabación y acciones */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-sm text-zinc-300 mb-2">Grabar Audio (minutas rápidas)</div>
          <AudioRecorder onStop={onRecorderStop} disabled={!canShow || busy} />
          <div className="text-xs text-zinc-500 mt-1">
            {audioBlob ? `Grabación lista (${Math.round((audioBlob.size || 0) / 1024)} KB)` : "Graba para habilitar acciones."}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSaveAudioOnly} disabled={!audioBlob || busy}
              className="px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm disabled:opacity-60">
              Guardar Audio en RAW
            </button>
            <button onClick={handleTranscribeAndSave} disabled={!audioBlob || busy}
              className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-60">
              Transcribir y Guardar
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-sm text-zinc-300 mb-2">Procesar Audio con IA</div>
          <div className="text-xs text-zinc-500">
            Transcribe grabaciones y, si quieres, genera un documento de inmediato.
          </div>
        </div>
      </div>

      {/* búsqueda + acciones */}
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, tipo o texto…"
          className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
        <button onClick={() => setUploadOpen(true)} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">
          Añadir RAW
        </button>
        <button onClick={fetchList} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">
          ↻ Refrescar
        </button>
      </div>

      {/* tabla */}
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
            {loading ? (
              <tr><td className="p-6 text-zinc-500" colSpan={4}>Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-6 text-zinc-500" colSpan={4}>No hay material RAW.</td></tr>
            ) : (
              filtered.map((file) => {
                const hasInline = !!(file?.tags && file.tags.inline_text);
                return (
                  <tr key={file.id} className="border-b border-zinc-800 hover:bg-zinc-900/30">
                    <td className="p-3">
                      <div className="font-semibold text-white">{file.filename}</div>
                      {hasInline && (
                        <div className="text-xs text-zinc-500 truncate max-w-[42rem]">
                          {file.tags.inline_text}
                        </div>
                      )}
                      {file.tags?.type && (
                        <div className="text-[10px] mt-1 text-zinc-400">tipo: {file.tags.type}</div>
                      )}
                    </td>
                    <td className="p-3">{file.mime || "desconocido"}</td>
                    <td className="p-3">{file.size ? `${Math.round(file.size / 1024)} KB` : "-"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <button onClick={() => handleClassify(file)} className="text-xs px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700">
                          Clasificar IA
                        </button>
                        <button onClick={() => handleGenerate(file, "technical")} disabled={busy || !hasInline}
                          className="text-xs px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50">
                          Doc Técnico
                        </button>
                        <button onClick={() => handleGenerate(file, "executive")} disabled={busy || !hasInline}
                          className="text-xs px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">
                          Minuta Ejecutiva
                        </button>
                        <button onClick={() => handleView(file)} className="text-xs px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700">Ver</button>
                        <button onClick={() => handleDownload(file)} className="text-xs px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700">Descargar</button>
                        <button onClick={() => handleDelete(file)} className="text-xs px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* modales */}
      {viewer.open && (
        <RawViewerModal
          isOpen={viewer.open}
          onClose={() => setViewer({ open: false, file: null, url: "", text: "" })}
          filename={viewer.file?.filename}
          mime={viewer.file?.mime}
          textContent={viewer.text}
          url={viewer.url}
          // Puedes pasar onSave si quisieras persistir edición aquí
        />
      )}

      <UploadRawModal
        projectId={projectId}
        onUploaded={fetchList}
        onClose={() => setUploadOpen(false)}
        isOpen={uploadOpen}
      />
    </div>
  );
}