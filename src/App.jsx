// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Público
import Login from './pages/Login';

// Layout + guardia
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas principales
import Dashboard from './pages/Dashboard';
import ProjectListView from './pages/ProjectListView';
import DocumentView from './pages/DocumentView';
import SearchView from './pages/SearchView';
import TemplatesView from './pages/TemplatesView';
import TemplateDetailView from './pages/TemplateDetailView';
import TemplateEditorView from './pages/TemplateEditorView';
import IntelligenceArchiveView from './pages/IntelligenceArchiveView';
import BriefingDetailView from './pages/BriefingDetailView';
import MindmapPage from './pages/MindmapPage';
import SettingsView from './pages/SettingsView';

// 🚀 Router modular del Hub de Proyecto (tabs: Dashboard / Raw / Docs / Roadmap)
import ProjectHubRouter from './pages/project/ProjectHubRouter';

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Privadas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Mindmap */}
          <Route path="/mindmap" element={<MindmapPage />} />
          <Route path="/mindmap/:id" element={<MindmapPage />} />

          {/* Proyectos */}
          <Route path="/projects" element={<ProjectListView />} />
          {/* Hub modular del proyecto */}
          <Route path="/projects/:projectId" element={<ProjectHubRouter />} />
          <Route path="/projects/:projectId/:tab" element={<ProjectHubRouter />} />

          {/* Documentos */}
          <Route path="/documents/:documentId" element={<DocumentView />} />

          {/* Búsqueda */}
          <Route path="/search" element={<SearchView />} />

          {/* Plantillas */}
          <Route path="/templates" element={<TemplatesView />} />
          <Route path="/templates/:templateId" element={<TemplateDetailView />} />
          <Route
            path="/templates/:templateId/versions/:versionId"
            element={<TemplateEditorView />}
          />

          {/* Config / Archivo / Briefings */}
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/archive" element={<IntelligenceArchiveView />} />
          <Route path="/briefing/:briefingId" element={<BriefingDetailView />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}