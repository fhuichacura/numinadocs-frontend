import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppLayout from './layouts/AppLayout';
import { useAuth } from './context/AuthContext';
import ProjectView from './pages/ProjectView';
import DocumentView from './pages/DocumentView';
import ProjectListView from './pages/ProjectListView';
import TemplatesView from './pages/TemplatesView';
import SettingsView from './pages/SettingsView';
import SearchView from './pages/SearchView';
import MindMapView from './pages/MindMapView';
import TemplateDetailView from './pages/TemplateDetailView';
import TemplateEditorView from './pages/TemplateEditorView'; // <-- Importa la nueva página
import IntelligenceArchiveView from './pages/IntelligenceArchiveView';
import BriefingDetailView from './pages/BriefingDetailView';


const Placeholder = ({ title }) => (
  <h1 className="text-3xl font-bold text-white">{title}</h1>
);

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />

      {/* Rutas Protegidas dentro del Layout Principal */}
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} 
      />
      <Route 
        path="/mindmap" 
        element={<ProtectedRoute><AppLayout><MindMapView /></AppLayout></ProtectedRoute>} 
      />
      <Route 
        path="/projects" 
        element={<ProtectedRoute><AppLayout><ProjectListView /></AppLayout></ProtectedRoute>} 
      />
      <Route 
        path="/projects/:projectId" 
        element={<ProtectedRoute><AppLayout><ProjectView /></AppLayout></ProtectedRoute>} 
      />
      <Route 
        path="/documents/:documentId" 
        element={<ProtectedRoute><AppLayout><DocumentView /></AppLayout></ProtectedRoute>} 
      />
      <Route 
        path="/search" 
        element={<ProtectedRoute><AppLayout><SearchView /></AppLayout></ProtectedRoute>} 
      />
      <Route 
        path="/templates" 
        element={<ProtectedRoute><AppLayout><TemplatesView /></AppLayout></ProtectedRoute>} 
      />
      <Route 
        path="/templates/:templateId" 
        element={<ProtectedRoute><AppLayout><TemplateDetailView /></AppLayout></ProtectedRoute>} 
      />
      {/* --- AÑADE ESTA NUEVA RUTA --- */}
      <Route 
        path="/templates/:templateId/versions/:versionId" 
        element={<ProtectedRoute><AppLayout><TemplateEditorView /></AppLayout></ProtectedRoute>} 
      />
      {/* ... (resto de las rutas) */}
      <Route 
        path="/settings" 
        element={<ProtectedRoute><AppLayout><SettingsView /></AppLayout></ProtectedRoute>} 
      />
      <Route 
        path="/archive" 
        element={<ProtectedRoute><AppLayout><IntelligenceArchiveView /></AppLayout></ProtectedRoute>} 
      />
      <Route 
        path="/briefing/:briefingId" 
        element={<ProtectedRoute><AppLayout><BriefingDetailView /></AppLayout></ProtectedRoute>} 
      />
    </Routes>
  );
}

export default App;
