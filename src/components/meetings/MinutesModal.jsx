import React, { useState } from "react";
import ExportPdfButton from "../document/ExportPdfButton";
import AudioRecorder from "../raw/AudioRecorder";
import { aiApi } from "../../api/ai";
import { meetingsApi } from "../../api/meetings";

export default function MinutesModal({ open, onClose, projectId, meeting, token, onSaved }) {
  const [notes,setNotes]=useState(""); const [audioBlob,setAudioBlob]=useState(null);
  const [busy,setBusy]=useState(false); const [msg,setMsg]=useState(""); const [saved,setSaved]=useState(null);
  if(!open) return null;

  const transcribe = async ()=>{ if(!audioBlob) return; setBusy(true); setMsg("Transcribiendo…");
    const text = await aiApi.transcribe(audioBlob, token); setNotes(n=>n?`${n}\n\n${text}`:text);
    setBusy(false); setMsg("Transcripción añadida.");
  };
  const structure = async ()=>{ if(!notes.trim()) return; setBusy(true); setMsg("Estructurando…");
    setNotes(await aiApi.structureMinutes(notes, token)); setBusy(false); setMsg("Acta estructurada.");
  };
  const save = async ()=>{ if(!notes.trim() && !audioBlob) return; setBusy(true); setMsg("Guardando acta…");
    const minutes = await meetingsApi.saveMinutes(projectId, meeting.id, notes, audioBlob, token);
    setSaved(minutes); await aiApi.semanticIndex({ projectId, resourceType:"minutes", resourceId: meeting.id, text: notes, token });
    // extrae pendientes [ ] ... (resp: x, venc: y)
    const re=/(?:^|\n)[\-\*]\s*\[(?:\s|x)?\]\s*(.+?)(?:\s*\(resp:\s*(.+?)\s*,\s*venc:\s*([^)]+)\))?/gi;
    const acts=[]; let m; while((m=re.exec(notes))!==null) acts.push({ title:m[1], owner:m[2]||null, due_date:m[3]||null, lane:"backlog" });
    if(acts.length) await meetingsApi.bulkActions(projectId, meeting.id, acts, token);
    await meetingsApi.upsertCalendarEvent(projectId, meeting, token);
    setBusy(false); setMsg("Acta guardada."); onSaved?.();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center">
      <div className="w-[98%] max-w-[1100px] bg-[#0f172a] border border-[#27272a] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-zinc-400">Acta de reunión</div>
            <h3 className="text-2xl font-bold text-white truncate">{meeting?.title||"Reunión"}</h3>
            <div className="text-xs text-zinc-500">{new Date(meeting?.date).toLocaleString()}</div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {saved && <ExportPdfButton scopeSelector=".minutes-export" filename={`Acta_${meeting?.title||"reunion"}`} />}
            <button onClick={onClose} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg">Cerrar</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm text-zinc-300 mb-2">Captura rápida</div>
            <AudioRecorder onBlob={setAudioBlob}/>
            <div className="mt-3">
              <button onClick={transcribe} disabled={!audioBlob||busy} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Transcribir Audio</button>
              {audioBlob && <span className="ml-3 text-xs text-zinc-400">Audio listo ({Math.round(audioBlob.size/1024)} KB)</span>}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 minutes-export">
            <div className="text-sm text-zinc-300 mb-2">Borrador del acta</div>
            <textarea value={notes} onChange={(e)=>setNotes(e.target.value)}
              placeholder={`• Resumen\n• Asistentes\n• Acuerdos\n• Pendientes [ ] Tarea (resp: Nombre, venc: 2025-09-01)\n• Próximos pasos`}
              className="w-full h-56 p-3 bg-zinc-900 rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-purple-300">{msg}</div>
          <div className="flex items-center gap-2">
            <button onClick={structure} disabled={busy||!notes.trim()} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">✨ Estructurar con IA</button>
            <button onClick={save} disabled={busy||(!notes.trim()&&!audioBlob)} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">Guardar Acta</button>
          </div>
        </div>
      </div>
    </div>
  );
}