// src/components/raw/AudioRecorder.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Grabador de audio con MediaRecorder.
 * Props:
 *  - onStop({ blob, durationMs }): callback al detener
 *  - disabled: deshabilita controles
 */
export default function AudioRecorder({ onStop, disabled = false }) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [err, setErr] = useState("");
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);
  const mediaRecRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      // cleanup
      stopTimer();
      try { mediaRecRef.current && mediaRecRef.current.stream?.getTracks()?.forEach(t => t.stop()); } catch {}
    };
  }, []);

  const startTimer = () => {
    const t0 = Date.now();
    stopTimer();
    timerRef.current = setInterval(() => setDuration(Date.now() - t0), 250);
  };
  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const start = async () => {
    if (disabled) return;
    setErr("");
    try {
      // Nota: en localhost https no es requerido; en producción necesitarás https para micrófono.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        try { stream.getTracks().forEach(t => t.stop()); } catch {}
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onStop?.({ blob, durationMs: duration });
        setPaused(false);
        setRecording(false);
        stopTimer();
        setDuration(0);
      };

      mr.start(1000); // recolecta chunks cada segundo
      setRecording(true);
      setPaused(false);
      startTimer();
    } catch (e) {
      console.error(e);
      setErr("No se pudo acceder al micrófono. Revisa permisos o usa https.");
    }
  };

  const pause = () => { try { mediaRecRef.current?.pause(); setPaused(true); } catch {} };
  const resume = () => { try { mediaRecRef.current?.resume(); setPaused(false); } catch {} };
  const stop = () => { try { mediaRecRef.current?.stop(); } catch {} };

  const fmt = (ms) => {
    const s = Math.floor(ms / 1000), mm = String(Math.floor(s / 60)).padStart(2, "0"), ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
    };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="text-sm text-zinc-300 mb-2">Grabar Audio (minutas rápidas)</div>
      <div className="flex items-center gap-2">
        {!recording ? (
          <button onClick={start} disabled={disabled} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
            Iniciar
          </button>
        ) : (
          <>
            {!paused ? (
              <button onClick={pause} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Pausar</button>
            ) : (
              <button onClick={resume} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">Reanudar</button>
            )}
            <button onClick={stop} className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white">Detener</button>
            <span className="ml-2 text-xs text-zinc-400">Duración: {fmt(duration)}</span>
          </>
        )}
      </div>
      {err && <div className="mt-2 text-xs text-red-400">{err}</div>}
    </div>
  );
}