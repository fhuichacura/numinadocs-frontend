// src/components/IntelligenceBriefingWidget.jsx
import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

function Toast({ text, kind="ok", onClose }) {
  if (!text) return null;
  const bg = kind === "err" ? "bg-red-600/80" : "bg-emerald-600/80";
  return (
    <div className={`fixed bottom-6 right-6 px-4 py-2 ${bg} text-white rounded shadow-lg z-50`}>
      <span>{text}</span>
      <button className="ml-4 underline" onClick={onClose}>Cerrar</button>
    </div>
  );
}

function Modal({ open, onClose, children, title="Resumen IA" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function IntelligenceBriefingWidget({
  fetch = true,
  endpoint = '/briefing/news',
  limit = 8,
  title = 'Noticias y Artículos',
  requestTimeout = 30000,
}) {
  const [loading, setLoading] = useState(fetch);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [toast, setToast] = useState({ text: '', kind: 'ok' });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSummary, setModalSummary] = useState({ points: [] });
  const [modalNote, setModalNote] = useState('');
  const [modalItem, setModalItem] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);

  const relPath = useMemo(() => (endpoint.startsWith('/') ? endpoint : `/${endpoint}`), [endpoint]);

  async function load(initial=false) {
    try {
      setLoading(true); setError(null);
      const res = await api.get(relPath, { timeout: requestTimeout });
      const items = Array.isArray(res?.data?.items) ? res.data.items
                  : Array.isArray(res?.data)        ? res.data
                  : [];
      setData(items);
    } catch (e) {
      const code = e?.code || e?.response?.status;
      if (initial && (code === 'ECONNABORTED' || code === 504)) {
        try {
          const res = await api.get(relPath, { timeout: Math.max(15000, requestTimeout) });
          const items = Array.isArray(res?.data?.items) ? res.data.items
                      : Array.isArray(res?.data)        ? res.data : [];
          setData(items); setError(null); return;
        } catch {
          setError('Tiempo de espera agotado. Intenta nuevamente.'); setData([]);
        }
      } else {
        setError(code === 404 ? 'Sin información disponible.' : 'No fue posible cargar la información.');
        setData([]);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled=false;
    if (!fetch) return;
    (async()=>{ if(!cancelled) await load(true); })();
    return ()=>{ cancelled=true; };
  }, [fetch, relPath, requestTimeout]);

  const items = useMemo(() => (Array.isArray(data) ? data.slice(0, limit) : []), [data, limit]);

  // ----- acciones -----
  async function openModalFor(item) {
    try {
      setModalItem(item); setModalOpen(true); setModalNote('');
      // preview con IA
      const res = await api.post('/briefing/preview', {
        title: item?.title || item?.headline || item?.name || 'Artículo',
        url: item?.url || item?.link || null,
        text: item?.summary || item?.description || null
      }, { timeout: 25000 });
      setModalSummary(res?.data?.summary || { points: [] });
    } catch (e) {
      setModalSummary({ points: [] });
    }
  }

  async function saveToArchive() {
    if (!modalItem) return;
    try {
      setModalSaving(true);
      const payload = {
        title: modalItem?.title || modalItem?.headline || modalItem?.name || 'Artículo',
        url: modalItem?.url || modalItem?.link || '#',
        source: modalItem?.source || '',
        summary: (Array.isArray(modalSummary?.points) ? modalSummary.points.join(' ') : ''),
        initial_note: modalNote || null,
        tags: modalItem?.tags || [],
      };
      await api.post('/briefing/ingest_and_archive', payload, { timeout: 30000 });
      setToast({ text: 'Guardado en Archivo', kind: 'ok' });
      setModalOpen(false);
    } catch (e) {
      console.error('[Guardar en archivo] error:', e);
      setToast({ text: 'No se pudo guardar', kind: 'err' });
    } finally {
      setModalSaving(false);
    }
  }

  // ----- render -----
  if (loading) return (
    <div className="animate-pulse">
      <div className="h-6 w-64 bg-gray-700/70 rounded mb-4" />
      <div className="space-y-2">{Array.from({length:4}).map((_,i)=>
        <div key={i} className="h-4 w-full bg-gray-700/50 rounded" />)}</div>
    </div>
  );
  if (error) return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-red-400 text-sm mb-2">{error}</p>
      <button onClick={()=>load(false)} className="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-700">Reintentar</button>
    </div>
  );
  if (!items.length) return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">Sin información disponible.</p>
    </div>
  );

  return (
    <>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <ul className="space-y-3">
        {items.map((it, idx) => {
          const href = it?.url || it?.link || '#';
          const text = it?.title || it?.headline || it?.name || `Item ${idx+1}`;
          const desc = it?.summary || it?.description || '';
          const source = it?.source || '';
          const date = it?.published_at || it?.created_at || '';
          return (
            <li key={it?.id || idx} className="group">
              <a href={href} target="_blank" rel="noreferrer"
                 className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">
                {text}
              </a>
              <div className="text-gray-400 text-xs mt-0.5">
                {source ? <span className="mr-2">{source}</span> : null}
                {date ? <span className="opacity-70">{new Date(date).toLocaleString('es-ES')}</span> : null}
              </div>
              {desc ? <p className="text-gray-400 text-sm leading-snug mt-0.5">
                {String(desc).length>220? String(desc).slice(0,220)+'…': String(desc)}
              </p> : null}

              <div className="mt-2 flex gap-2">
                <a href={href} target="_blank" rel="noreferrer"
                   className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">Ver fuente</a>
                <button className="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700"
                        onClick={()=>openModalFor(it)}>Guardar</button>
                <button className="text-xs px-2 py-1 rounded bg-purple-600 hover:bg-purple-700"
                        onClick={()=>openModalFor(it)}>Anotar</button>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="Resumen IA (editable)">
        <div className="space-y-3">
          <label className="block text-sm text-gray-300 mb-1">Resumen</label>
          <textarea
            className="w-full h-28 rounded bg-gray-800 border border-gray-700 p-3 text-sm"
            value={Array.isArray(modalSummary.points) ? modalSummary.points.join(' ') : ''}
            onChange={(e)=>setModalSummary({ points: [e.target.value] })}
          />
          <label className="block text-sm text-gray-300 mb-1">Apunte (opcional)</label>
          <textarea
            className="w-full h-20 rounded bg-gray-800 border border-gray-700 p-3 text-sm"
            placeholder="Tu apunte personal…"
            value={modalNote}
            onChange={(e)=>setModalNote(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <button className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600" onClick={()=>setModalOpen(false)}>
              Cancelar
            </button>
            <button
              className="px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              onClick={saveToArchive}
              disabled={modalSaving}
            >
              {modalSaving ? 'Guardando…' : 'Guardar en Archivo'}
            </button>
          </div>
        </div>
      </Modal>

      <Toast text={toast.text} kind={toast.kind} onClose={()=>setToast({text:'',kind:'ok'})} />
    </>
  );
}
