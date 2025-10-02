import React, { useEffect, useState } from "react";
import { meetingsApi } from "../../api/meetings";
import MinutesModal from "./MinutesModal";

export default function MeetingPanel({ projectId, token }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => setItems(await meetingsApi.list(projectId, token));
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[projectId, token]);

  const add = async () => {
    if(!title.trim()||!date) return;
    setBusy(true); await meetingsApi.create(projectId, { title:title.trim(), date }, token);
    setTitle(""); setDate(""); await load(); setBusy(false);
    setMsg("Reunión agendada."); setTimeout(()=>setMsg(""),1500);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-white">Reuniones</div>
        <div className="text-xs text-purple-300">{msg}</div>
      </div>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Título de la reunión"
          className="flex-1 min-w-0 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm"/>
        <input type="datetime-local" value={date} onChange={(e)=>setDate(e.target.value)}
          className="min-w-0 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm"/>
        <button onClick={add} disabled={busy} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">Agendar</button>
      </div>
      <div className="space-y-2">
        {items.length===0 ? <div className="text-sm text-zinc-500">Sin reuniones agendadas.</div> :
          items.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(m=>(
            <div key={m.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium text-zinc-200 truncate">{m.title}</div>
                <div className="text-xs text-zinc-500">{new Date(m.date).toLocaleString()}</div>
                {m.minutes && <div className="text-xs text-emerald-400 mt-1">Acta generada</div>}
              </div>
              <div className="shrink-0">
                <button onClick={()=>{ setSelected(m); setOpen(true); }} className="text-xs px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white">Acta</button>
              </div>
            </div>
          ))
        }
      </div>
      <MinutesModal open={open} onClose={()=>{ setOpen(false); setSelected(null); }} projectId={projectId} meeting={selected} token={token} onSaved={load}/>
    </div>
  );
}