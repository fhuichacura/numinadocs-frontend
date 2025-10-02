// src/pages/project/tabs/SemanticSearchTab.jsx
import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { documentsApi } from "../../../api/documents";

export default function SemanticSearchTab({ projectId }) {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState([]);

  const search = async () => {
    if (!q.trim()) return;
    try {
      setLoading(true);
      const data = await documentsApi.searchSemantic(projectId, q.trim(), 8, token);
      setRes(data.results || []);
    } catch (e) {
      console.error(e);
      setRes([]);
      alert("No se pudo ejecutar la búsqueda semántica.");
    } finally {
      setLoading(false);
    }
  };

  const openResource = (r) => {
    if (r.resource_type === "raw") {
      alert(`Abrir RAW id=${r.resource_id} (puedes abrir modal o navegar a RawVault y buscar la fila)`);
      // aquí podrías emitir un evento o navegar a Raw tab y prefiltrar
    } else if (r.resource_type === "document") {
      window.location.href = `/documents/${r.resource_id}`;
    } else {
      alert(`Tipo no soportado aún: ${r.resource_type}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e)=> e.key==='Enter' && search()}
            placeholder="Buscar con IA (ej: despliegue ECS, diagrama mermaid, comandos kubectl)…"
            className="flex-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm"
          />
          <button onClick={search} disabled={loading} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="text-sm text-zinc-400 mb-2">Resultados</div>
        {res.length === 0 ? (
          <div className="text-sm text-zinc-500">Sin resultados aún.</div>
        ) : (
          <div className="space-y-2">
            {res.map((r, i) => (
              <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div className="text-xs text-zinc-500 mb-1">
                  {r.resource_type} {r.section ? `· ${r.section}` : ""}
                </div>
                <div className="text-sm text-zinc-200 whitespace-pre-wrap">{r.snippet}</div>
                <div className="mt-2">
                  <button onClick={() => openResource(r)} className="text-xs px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">
                    Abrir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}