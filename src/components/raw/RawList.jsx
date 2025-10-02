// src/components/RawList.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axios";
import RawViewerModal from "./RawViewerModal";

/**
 * Tabla de RAW:
 * - GET /projects/:projectId/raw             -> lista
 * - GET /projects/:projectId/raw/:fileId     -> { inline text } o { url, mime, filename }
 * - GET /projects/:projectId/raw/:fileId?download=true  -> presigned con Content-Disposition
 * - DELETE /projects/:projectId/raw/:fileId
 */
export default function RawList({ projectId }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // viewer modal
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerText, setViewerText] = useState("");
  const [viewerMime, setViewerMime] = useState("");
  const [viewerName, setViewerName] = useState("");

  const fetchList = async () => {
    if (!token || !projectId) return;
    try {
      setLoading(true);
      setErr("");
      const { data } = await apiClient.get(`/projects/${projectId}/raw`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar la lista de RAW.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [token, projectId]);

  const handleView = async (file) => {
    try {
      // pedimos el recurso sin `download` para ver si es inline o url presignada
      const { data } = await apiClient.get(`/projects/${projectId}/raw/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Si es texto inline, tu backend responde PlainText (string) o JSON con 'url'
      if (typeof data === "string") {
        setViewerText(data);
        setViewerMime(file.mime || "text/plain");
        setViewerName(file.filename || "raw.txt");
        setViewerOpen(true);
        return;
      }

      if (data && data.url) {
        // presigned URL -> abre en nueva pestaña
        window.open(data.url, "_blank", "noopener");
        return;
      }

      // fallback
      alert("No fue posible obtener el contenido. Intenta Descargar.");
    } catch (e) {
      console.error(e);
      alert("No fue posible abrir el archivo.");
    }
  };

  const handleDownload = async (file) => {
    try {
      // para descarga forzada, usa ?download=true (tu endpoint ya lo soporta)
      const { data } = await apiClient.get(`/projects/${projectId}/raw/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { download: true },
      });

      if (data && data.url) {
        window.open(data.url, "_blank", "noopener");
        return;
      }

      // si es inline text y no hay presigned, descarga localmente
      if (typeof data === "string") {
        const blob = new Blob([data], { type: file.mime || "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename || "raw.txt";
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      alert("No fue posible descargar el archivo.");
    } catch (e) {
      console.error(e);
      alert("No fue posible descargar el archivo.");
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`¿Eliminar "${file.filename}"?`)) return;
    try {
      await apiClient.delete(`/projects/${projectId}/raw/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchList();
    } catch (e) {
      console.error(e);
      alert("No fue posible eliminar el archivo.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Material RAW</h3>
        <button
          onClick={fetchList}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
        >
          ↻ Refrescar
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-4 text-red-300">
          {err}
        </div>
      )}

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
              <>
                {[...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3"><div className="h-4 w-48 bg-zinc-800 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
                    <td className="p-3 text-right"><div className="h-8 w-28 ml-auto bg-zinc-800 rounded" /></td>
                  </tr>
                ))}
              </>
            ) : items.length === 0 ? (
              <tr>
                <td className="p-6 text-zinc-500" colSpan={4}>
                  No hay material RAW en este proyecto.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-b border-zinc-800 hover:bg-zinc-900/30">
                  <td className="p-3">
                    <span className="font-semibold text-white">{it.filename}</span>
                  </td>
                  <td className="p-3">{it.mime || "desconocido"}</td>
                  <td className="p-3">{it.size ? `${Math.round(it.size / 1024)} KB` : "-"}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleView(it)}
                        className="text-xs px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                        title="Abrir (inline o URL presignada)"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleDownload(it)}
                        className="text-xs px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                        title="Descargar"
                      >
                        Descargar
                      </button>
                      <button
                        onClick={() => handleDelete(it)}
                        className="text-xs px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white"
                        title="Eliminar"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RawViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        filename={viewerName}
        mime={viewerMime}
        textContent={viewerText}
      />
    </div>
  );
}