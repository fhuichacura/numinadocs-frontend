// Simple mock service. Swap with real API calls later.
const LS_KEY = "numinadocs.projects.v1";

const seed = [
  {
    id: "p-001",
    name: "Mapa demo - 1",
    description: "Generado desde Mapa Mental",
    status: "in_progress", // in_progress | paused | completed
    progress: 12,
    nextMilestone: "Implementar Alembic",
    lastActivity: "Recién Creado",
    createdAt: Date.now(),
    aiNotes: "",
  },
  {
    id: "p-002",
    name: "Mapa demo - 2",
    description: "Generado desde Mapa Mental",
    status: "in_progress",
    progress: 0,
    nextMilestone: "Definir Task Definition en ECS",
    lastActivity: "Recién Creado",
    createdAt: Date.now(),
    aiNotes: "",
  },
];

function load() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) {
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed;
  }
}

function save(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export const ProjectsAPI = {
  async list() {
    return load().sort((a, b) => b.createdAt - a.createdAt);
  },
  async get(id) {
    return load().find(p => p.id === id) || null;
  },
  async create(payload) {
    const data = load();
    const item = { ...payload, id: `p-${crypto.randomUUID().slice(0,6)}`, createdAt: Date.now(), progress: 0, status: "in_progress", aiNotes: "" };
    data.unshift(item);
    save(data);
    return item;
  },
  async update(id, patch) {
    const data = load();
    const idx = data.findIndex(p => p.id === id);
    if (idx >= 0) {
      data[idx] = { ...data[idx], ...patch };
      save(data);
      return data[idx];
    }
    return null;
  },
  async remove(id) {
    const data = load().filter(p => p.id !== id);
    save(data);
    return true;
  },
  // Simulación: sugerencias IA (reemplaza luego por tu endpoint real / Gemini / OpenAI)
  async suggestMilestones(/* { asIs, toBe } */) {
    return [
      { title: "Autenticación & Roles por Proyecto", desc: "Habilitar RBAC (owner, editor, viewer) y flujos de aprobación por hito." },
      { title: "Búsqueda Semántica", desc: "Indexar documentos del proyecto (vector DB) y habilitar QA contextual." },
      { title: "Integración DevOps", desc: "Webhook/Jira GitHub: crear issues desde el roadmap y sincronizar estados." },
    ];
  },
};