// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppLayout from './layouts/AppLayout';

import ProjectView from './pages/ProjectView';
import DocumentView from './pages/DocumentView';
import ProjectListView from './pages/ProjectListView';
import TemplatesView from './pages/TemplatesView';
import SettingsView from './pages/SettingsView';
import SearchView from './pages/SearchView';
import MindMapView from './pages/MindMapView';
import TemplateDetailView from './pages/TemplateDetailView';
import TemplateEditorView from './pages/TemplateEditorView';
import IntelligenceArchiveView from './pages/IntelligenceArchiveView';
import BriefingDetailView from './pages/BriefingDetailView';

import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mindmap" element={<MindMapView />} />
          <Route path="/projects" element={<ProjectListView />} />
          <Route path="/projects/:projectId" element={<ProjectView />} />
          <Route path="/documents/:documentId" element={<DocumentView />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/templates" element={<TemplatesView />} />
          <Route path="/templates/:templateId" element={<TemplateDetailView />} />
          <Route path="/templates/:templateId/versions/:versionId" element={<TemplateEditorView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/archive" element={<IntelligenceArchiveView />} />
          <Route path="/briefing/:briefingId" element={<BriefingDetailView />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
