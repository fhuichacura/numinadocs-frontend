// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';

import ProjectTable from '../components/ProjectTable';
import CalendarWidget from '../components/CalendarWidget';
import QuickNotesWidget from '../components/QuickNotesWidget';
import IntelligenceBriefingWidget from '../components/IntelligenceBriefingWidget';

const formatNumber = (n) => {
  const v = Number(n); return Number.isNaN(v) ? '0' : new Intl.NumberFormat('es-ES').format(v);
};

const KpiCard = ({ title, value, icon, loading }) => (
  <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex items-center transition-all hover:border-purple-500 hover:bg-gray-800">
    <div className="bg-purple-600/20 p-3 rounded-lg mr-4 text-purple-400">{icon}</div>
    <div>
      <div className="text-3xl font-bold text-white">{loading ? '…' : formatNumber(value)}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  </div>
);

const icons = {
  events: (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>),
  tasks:  (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>),
  risk:   (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>),
  docs:   (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>),
};

export default function Dashboard() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');

  const friendlyName = useMemo(() => {
    try { return user?.email?.split('@')[0] || 'Usuario'; } catch { return 'Usuario'; }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    if (!token) return;
    (async () => {
      setLoading(true); setErrMsg('');
      try {
        const [pr, met] = await Promise.all([
          apiClient.get('/projects/'),
          apiClient.get('/dashboard/'),
        ]);
        if (cancelled) return;
        setProjects(Array.isArray(pr?.data) ? pr.data : []);
        const m = met?.data || {};
        setMetrics({
          events_today: m.events_today ?? 0,
          overdue_tasks: m.overdue_tasks ?? 0,
          projects_inactive: m.projects_inactive ?? 0,
          documents_generated: m.documents_generated ?? 0,
        });
      } catch (e) {
        console.error('Error Dashboard:', e);
        if (!cancelled) {
          setErrMsg('No fue posible cargar el Dashboard. Intenta nuevamente.');
          setProjects([]); setMetrics({ events_today:0, overdue_tasks:0, projects_inactive:0, documents_generated:0 });
        }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Cabecera */}
      <div className="flex justify-between items-center flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">Bienvenido, {friendlyName}</h1>
        <Link to="/projects" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold text-sm">
          Ver todos los Proyectos
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiCard title="Eventos para Hoy"       value={metrics?.events_today}        icon={icons.events} loading={loading} />
        <KpiCard title="Tareas Atrasadas"       value={metrics?.overdue_tasks}       icon={icons.tasks}  loading={loading} />
        <KpiCard title="Proyectos Inactivos"    value={metrics?.projects_inactive}   icon={icons.risk}   loading={loading} />
        <KpiCard title="Documentos Generados"   value={metrics?.documents_generated} icon={icons.docs}   loading={loading} />
      </div>

      {/* Dos columnas */}
      <div className="flex-grow flex flex-col lg:flex-row gap-8 overflow-hidden">
        {/* Izquierda */}
        <div className="w-full lg:w-2/3 flex flex-col gap-8">
          <ProjectTable projects={projects} loading={loading} />
          <QuickNotesWidget />
        </div>

        {/* Derecha */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 min-h-0">
          {/* Noticias (scroll interno) */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 min-h-[200px] max-h-[360px] overflow-y-auto">
            <IntelligenceBriefingWidget
              fetch
              endpoint="/briefing/news"
              limit={8}
              title="Noticias y Artículos"
              requestTimeout={30000}
            />
          </div>
          {/* Calendario (siempre visible) */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex-grow min-h-[320px]">
            <CalendarWidget />
          </div>
        </div>
      </div>

      {errMsg ? (
        <div className="w-full bg-red-500/10 border border-red-500/40 text-red-200 text-sm px-4 py-3 rounded-lg">
          {errMsg}
        </div>
      ) : null}
    </div>
  );
}
