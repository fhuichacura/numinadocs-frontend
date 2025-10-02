import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { rawApi } from "../../api/raw";
import { aiApi } from "../../api/ai";

export default function UploadRawModal({ isOpen, onClose, projectId, onUploaded }) {
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [note, setNote] = useState("");
  const [noteName, setNoteName] = useState("nota.txt");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // preview
  const [showGraph, setShowGraph] = useState(true);
  const [isMermaid, setIsMermaid] = useState(false);

  useEffect(() => {
    const lc = (note || "").trim().toLowerCase();
    const starters = ["```mermaid", "flowchart", "graph td", "graph tb", "sequencediagram","statediagram","classdiagram","erdiagram","gantt","journey","pie","mindmap","timeline","gitgraph"];
    setIsMermaid(starters.some(s => lc.startsWith(s)));
  }, [note]);

  const handleFiles = (list) => {
    setFiles(prev => prev.concat(Array.from(list || [])));
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };

  const onPaste = (e) => {
    if (!e.clipboardData) return;
    const items = e.clipboardData.items;
    const fs = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) fs.push(f);
      }
    }
    if (fs.length) handleFiles(fs);
    else {
      const text = e.clipboardData.getData("text/plain");
      if (text) setNote(prev => (prev ? prev + "\n" : "") + text);
    }
  };

  const reset = () => {
    setFiles([]); setNote(""); setNoteName("nota.txt"); setMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadSelectedFiles = async () => {
    if (!files.length) return 0;
    let ok = 0;
    for (const f of files) {
      try {
        setMsg(`Subiendo: ${f.name}…`);
        // presign
        const ps = await rawApi.presign(projectId, f.name, f.type || "application/octet-stream", token);
        // POST S3
        const form = new FormData();
        Object.entries(ps.fields).forEach(([k, v]) => form.append(k, v));
        form.append("file", f);
        const r = await fetch(ps.url, { method: "POST", body: form });
        if (!r.ok) throw new Error(`S3 upload failed: ${r.status}`);

        // commit
        const { file_id } = await rawApi.commit(
          projectId,
          { project_id: projectId, key: ps.key, mime: f.type || "application/octet-stream", size: f.size, checksum: null, tags: {} },
          token
        );

        // clasificar automático (no bloquea si falla)
        try { await aiApi.classifyRaw({ projectId, fileId: file_id, token }); } catch {}
        ok++;
      } catch (e) {
        console.error(e);
        alert(`No fue posible subir "${f.name}".`);
      }
    }
    return ok;
  };

  const saveNote = async () => {
    if (!note.trim()) return false;
    try {
      setMsg("Guardando nota inline…");
      // si aparenta mermaid y no tiene fences, normalizamos al guardar (visual)
      const needsFence = isMermaid && !note.trim().toLowerCase().startsWith("```mermaid");
      const toSave = needsFence ? `\`\`\`mermaid\n${note}\n\`\`\`` : note;

      const { file_id } = await rawApi.addInlineNote({ projectId, text: toSave, filename: noteName, token });

      // clasificar automático
      try { await aiApi.classifyRaw({ projectId, fileId: file_id, token }); } catch {}
      return true;
    } catch (e) {
      console.error(e);
      alert("No fue posible crear la nota.");
      return false;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (!files.length && !note.trim()) {
      alert("Selecciona archivos o escribe una nota/diagrama.");
      return;
    }
    setBusy(true);
    try {
      const upCount = await uploadSelectedFiles();
      const noteOk = await saveNote();
      if (upCount || noteOk) {
        onUploaded?.();
        reset();
        onClose?.();
      } else {
        alert("No se subió nada.");
      }
    } finally {
      setBusy(false);
      setMsg("");
    }
  };

  // mermaid live preview
  const MermaidPreview = () => {
    const containerRef = useRef(null);
    useEffect(() => {
      let cancel = false;
      (async () => {
        if (!isMermaid || !showGraph) return;
        try {
          const mermaid = (await import("mermaid")).default;
          mermaid.initialize({ startOnLoad: false, theme: "dark" });
          const code = note.trim().toLowerCase().startsWith("```mermaid")
            ? note.replace(/^```mermaid\s*/i, "").replace(/```$/, "")
            : note;
          const { svg } = await mermaid.render("mmd-" + Date.now(), code);
          if (!cancel && containerRef.current) containerRef.current.innerHTML = svg;
        } catch (e) { console.error("mermaid:", e); }
      })();
      return () => { cancel = true; };
    }, [note, isMermaid, showGraph]);
    return <div ref={containerRef} />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onDrop={onDrop} onDragOver={(e)=>e.preventDefault()}>
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-200 shadow-xl" onPaste={onPaste}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Añadir al RAW Vault</h3>
          <button onClick={()=>{ reset(); onClose?.(); }} className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700">Cerrar</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Dropzone/Selector */}
          <div className="rounded-lg border border-dashed border-zinc-700 p-4 bg-zinc-900/40">
            <div className="text-sm text-zinc-400 mb-2">
              Arrastra PDF, imágenes, markdown, texto… o selecciona:
            </div>
            <input ref={fileInputRef} type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="block w-full text-sm text-gray-300"/>
            {!!files.length && (
              <ul className="text-xs text-gray-400 mt-2 max-h-24 overflow-auto">
                {files.map((f) => <li key={f.name}>{f.name} ({Math.round(f.size/1024)} KB)</li>)}
              </ul>
            )}
          </div>

          {/* Nota/Comandos + nombre */}
          <div className="space-y-2">
            <div className="text-sm text-zinc-400">O pega una nota/diagrama/comandos:</div>
            <input
              value={noteName}
              onChange={(e)=>setNoteName(e.target.value)}
              placeholder="Nombre de la nota (ej. diagrama-backend.mmd)"
              className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-sm"
            />
            <textarea
              value={note}
              onChange={(e)=>setNote(e.target.value)}
              placeholder="Ej: ```mermaid\nflowchart LR; A-->B;\n```  o comandos bash/kubectl…"
              className="w-full min-h-[140px] p-3 rounded bg-zinc-900 border border-zinc-800 text-sm"
            />
            {note.trim() && (
              <div className="mt-2 rounded border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-zinc-400">Previsualización</div>
                  {isMermaid && (
                    <button type="button" onClick={()=>setShowGraph(s=>!s)} className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs">
                      {showGraph ? "Ver código" : "Ver gráfico"}
                    </button>
                  )}
                </div>
                {isMermaid && showGraph ? (
                  <MermaidPreview />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm leading-6">{note}</pre>
                )}
              </div>
            )}
          </div>

          {/* Barra acciones */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500">{busy ? (msg || "Procesando…") : "La IA clasifica automáticamente después de subir."}</div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={()=>{ reset(); onClose?.(); }} className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700">Cancelar</button>
              <button type="submit" disabled={busy} className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white">
                {busy ? "Subiendo…" : "Guardar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}