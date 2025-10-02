// src/components/raw/RawViewerModal.jsx
import React, { useEffect, useMemo, useState } from "react";

export default function RawViewerModal({ isOpen, onClose, filename, mime, textContent, url }) {
  const [view, setView] = useState("preview"); // preview | code
  const [edit, setEdit] = useState(false);     // edición de texto (visual)
  const [text, setText] = useState(textContent || "");

  useEffect(() => { setText(textContent || ""); setEdit(false); setView("preview"); }, [isOpen, textContent]);

  const isText = (mime || "").startsWith("text/");
  const isAudio = (mime || "").startsWith("audio/");
  const isImage = (mime || "").startsWith("image/");
  const isPdf = (mime || "").includes("pdf");

  const isMermaid = useMemo(() => {
    const t = (textContent || "").trim().toLowerCase();
    return t.startsWith("```mermaid") || t.startsWith("flowchart") || t.startsWith("graph ");
  }, [textContent]);

  useEffect(() => {
    if (isOpen && isMermaid && window.mermaid && view === "preview") {
      try {
        const code = (textContent || "").replace(/^```mermaid\s*/i, "").replace(/```$/i, "");
        window.mermaid.initialize({ startOnLoad: false, theme: "dark" });
        window.mermaid.render("mermaid-svg", code, (svg) => {
          const container = document.getElementById("mermaid-container");
          if (container) container.innerHTML = svg;
        });
      } catch { /* noop */ }
    }
  }, [isOpen, isMermaid, textContent, view]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="w-[92vw] max-w-5xl max-h-[88vh] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 shadow-xl flex flex-col">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-400">Contenido RAW</div>
            <div className="text-lg font-semibold text-white">{filename}</div>
            <div className="text-[11px] text-zinc-500">{mime}</div>
          </div>
          <div className="flex gap-2">
            {isText && (
              <button onClick={() => setEdit(v => !v)}
                className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sm">
                {edit ? "Cancelar" : "Editar"}
              </button>
            )}
            <button onClick={() => {
              if (url) window.open(url, "_blank", "noopener");
              else {
                const blob = new Blob([textContent || ""], { type: mime || "text/plain" });
                const href = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = href; a.download = filename || "raw.txt"; a.click();
                URL.revokeObjectURL(href);
              }
            }} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sm">
              Descargar
            </button>
            <button onClick={onClose} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sm">Cerrar</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {isText && edit ? (
            <textarea
              className="w-full min-h-[55vh] p-3 rounded bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={text} onChange={(e) => setText(e.target.value)}
            />
          ) : (
            <>
              {isText && !isMermaid && (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">{textContent}</pre>
              )}

              {isText && isMermaid && (
                <div>
                  <div className="mb-2 flex gap-2">
                    <button onClick={() => setView("preview")}
                      className={`px-3 py-1 rounded ${view === "preview" ? "bg-purple-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"}`}>
                      Ver gráfico
                    </button>
                    <button onClick={() => setView("code")}
                      className={`px-3 py-1 rounded ${view === "code" ? "bg-purple-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"}`}>
                      Ver código
                    </button>
                  </div>
                  {view === "preview" ? (
                    <div id="mermaid-container" className="bg-zinc-950 p-3 rounded border border-zinc-800 overflow-auto" />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">{textContent}</pre>
                  )}
                </div>
              )}

              {isAudio && url && <audio controls src={url} className="w-full" />}
              {isImage && url && <div className="flex justify-center">
                <img src={url} alt={filename} className="max-w-full max-h-[70vh] object-contain rounded" />
              </div>}
              {isPdf && url && <iframe title="pdf" src={url} className="w-full h-[70vh] rounded bg-zinc-950" />}

              {!isText && !isAudio && !isImage && !isPdf && !url && (
                <div className="text-sm text-zinc-400">Este tipo no tiene previsualización disponible.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}