// src/pages/project/ProjectHubRouter.jsx
// Router delgado: obtiene data y delega a cada tab modular.
import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axios";
import { rawApi } from "../../api/raw";
import { documentsApi } from "../../api/documents";

import DashboardTab from "./tabs/DashboardTab";
import RawVaultTab from "./tabs/RawVaultTab";
import DocumentsTab from "./tabs/DocumentsTab";
import RoadmapTab from "./tabs/RoadmapTab";

const TABS = ["dashboard", "raw", "documents", "roadmap"];

export default function ProjectHubRouter() {
  const { projectId, tab } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [active, setActive] = useState(TABS.includes(tab) ? tab : "dashboard");
  const [project, setProject] = useState({ id: projectId, name: "Proyecto" });

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [rawItems, setRawItems] = useState([]);
  const [loadingRaw, setLoadingRaw] = useState(true);

  // Sincroniza URL → estado
  useEffect(() => {
    if (tab && TABS.includes(tab) && tab !== active) setActive(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Opcional: sincroniza estado → URL (cuando clicas pestañas)
  useEffect(() => {
    if (!TABS.includes(active)) return;
    if (tab !== active) navigate(`/projects/${projectId}/${active}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Cargar proyecto
  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const r = await apiClient.get(`/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(r.data || { id: projectId, name: "Proyecto" });
      } catch (e) {
        console.warn("No se pudo cargar el proyecto:", e);
        setProject({ id: projectId, name: "Proyecto" });
      }
    })();
  }, [token, projectId]);

  const reloadDocs = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingDocs(true);
      const list = await documentsApi.listByProject(projectId, token);
      setDocuments(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("No se pudieron cargar documentos:", e);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [token, projectId]);

  const reloadRaw = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingRaw(true);
      const list = await rawApi.list(projectId, token);
      setRawItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("No se pudieron cargar RAW:", e);
      setRawItems([]);
    } finally {
      setLoadingRaw(false);
    }
  }, [token, projectId]);

  useEffect(() => {
    reloadDocs();
    reloadRaw();
  }, [reloadDocs, reloadRaw]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <Link to="/projects" className="text-sm text-purple-400 hover:text-white">
            &larr; Volver a Proyectos
          </Link>
          <h1 className="text-3xl font-bold text-white mt-1 truncate">
            {project?.name || "Proyecto"}
          </h1>
          <p className="text-sm text-zinc-400 truncate">{project?.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        {TABS.map((id) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              active === id
                ? "border-purple-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {id === "dashboard"
              ? "Dashboard"
              : id === "raw"
              ? "Raw Vault"
              : id === "documents"
              ? "Documentos"
              : "Roadmap + IA"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === "dashboard" && (
        <DashboardTab project={project} documents={documents} rawItems={rawItems} token={token} />
      )}

      {active === "raw" && (
        <RawVaultTab
          projectId={projectId}
          tokenFromParent={token}
        />
      )}

      {active === "documents" && (
        <DocumentsTab
          projectId={projectId}
          documents={documents}
          loadingDocs={loadingDocs}
          onGenerate={() => setActive("raw")}
        />
      )}

      {active === "roadmap" && <RoadmapTab />}
    </div>
  );
}