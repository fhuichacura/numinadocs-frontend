// src/api/meetings.js
import apiClient from "./axios";

const ns = (projectId) => `nd.meetings.${projectId}`;
const readLS = (k) => JSON.parse(localStorage.getItem(k) || "[]");
const writeLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const meetingsApi = {
  async list(projectId, token) {
    try {
      const res = await apiClient.get(`/projects/${projectId}/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data || [];
    } catch {
      return readLS(ns(projectId));
    }
  },

  async create(projectId, payload, token) {
    try {
      const res = await apiClient.post(`/projects/${projectId}/meetings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch {
      // fallback
      const items = readLS(ns(projectId));
      const m = { id: crypto.randomUUID(), ...payload };
      writeLS(ns(projectId), [m, ...items]);
      return m;
    }
  },

  async saveMinutes(projectId, meetingId, notes, audioBlob, token) {
    try {
      if (audioBlob) {
        const fd = new FormData();
        fd.append("notes", notes || "");
        fd.append("audio", audioBlob, `meeting-${meetingId}.webm`);
        const res = await apiClient.post(`/projects/${projectId}/meetings/${meetingId}/minutes`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        return res.data?.minutes || { notes };
      } else {
        const res = await apiClient.post(`/projects/${projectId}/meetings/${meetingId}/minutes`, { notes }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return res.data?.minutes || { notes };
      }
    } catch {
      // fallback: guarda “minutes” dentro del LS del meeting
      const items = readLS(ns(projectId));
      writeLS(ns(projectId), items.map(m => m.id===meetingId ? { ...m, minutes: { notes } } : m));
      return { notes };
    }
  },

  async bulkActions(projectId, meetingId, actions, token) {
    try {
      await apiClient.post(`/projects/${projectId}/actions/bulk`, {
        meeting_id: meetingId, items: actions
      }, { headers: { Authorization: `Bearer ${token}` } });
      return true;
    } catch { return false; }
  },

  async upsertCalendarEvent(projectId, meeting, token) {
    try {
      const res = await apiClient.post(`/calendar/events`, {
        project_id: projectId, meeting_id: meeting.id, title: meeting.title, date: meeting.date
      }, { headers: { Authorization: `Bearer ${token}` } });
      return res.data?.event_id || null;
    } catch { return null; }
  },
};