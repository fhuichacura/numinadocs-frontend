// src/components/roadmap/RoadmapCard.jsx
import React from "react";

// Ícono único futurista (cristal/pulso)
const PulseIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden>
    <defs>
      <linearGradient id="nd-pulse" x1="0" x2="1">
        <stop offset="0" stopColor="#8b5cf6"/>
        <stop offset="1" stopColor="#22d3ee"/>
      </linearGradient>
    </defs>
    <path d="M7 34h10l6-16 10 28 8-18h10" stroke="url(#nd-pulse)" strokeWidth="4" fill="none" strokeLinecap="round"/>
  </svg>
);

export default function RoadmapCard({ item, onMove, laneId }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-purple-500/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PulseIcon className="w-4 h-4" />
          <div className="font-medium text-zinc-100">{item.title}</div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
          item.prio === "H" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
        }`}>
          {item.prio === "H" ? "Alta" : "Media"}
        </span>
      </div>
      {!!item.desc && <div className="text-xs text-zinc-500 mt-1">{item.desc}</div>}

      <div className="flex flex-wrap gap-2 mt-2">
        {laneId !== "backlog" && (
          <button
            onClick={() => onMove(laneId, "backlog", item.id)}
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          >
            ← Backlog
          </button>
        )}
        {laneId !== "doing" && (
          <button
            onClick={() => onMove(laneId, "doing", item.id)}
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          >
            → En curso
          </button>
        )}
        {laneId !== "done" && (
          <button
            onClick={() => onMove(laneId, "done", item.id)}
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
          >
            ✓ Hecho
          </button>
        )}
      </div>
    </div>
  );
}