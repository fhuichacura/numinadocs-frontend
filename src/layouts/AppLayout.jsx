// src/layouts/AppLayout.jsx
import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AppLayout({ children }) {
  const location = useLocation();

  // Al cambiar de ruta, vuelve al inicio del contenedor principal
  useEffect(() => {
    const el = document.getElementById('main-content');
    if (el) el.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Si el layout recibe children (patrón antiguo) los usa; si no, Outlet (rutas anidadas)
  const Content = children ?? <Outlet />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Accesibilidad: enlace para saltar al contenido */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-indigo-600 text-white px-3 py-2 rounded"
      >
        Ir al contenido
      </a>

      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div
          className="flex h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)]
                     rounded-2xl border border-gray-800 bg-gray-900/80
                     shadow-2xl shadow-black/40 overflow-hidden"
        >
          {/* Sidebar (visible desde md+) */}
          <aside className="hidden md:block w-72 shrink-0 border-r border-gray-800 bg-gray-900/60">
            <Sidebar />
          </aside>

          {/* Contenido principal */}
          <main
            id="main-content"
            role="main"
            aria-label="Contenido principal"
            className="flex-1 overflow-y-auto focus:outline-none"
          >
            <div className="p-4 sm:p-6 lg:p-8">
              <Suspense fallback={<div className="text-gray-300">Cargando…</div>}>
                {Content}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
