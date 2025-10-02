// src/api/ai.js
import apiClient from "./axios";
export const aiApi = {
  
  
  async transcribe({ blob, token }) {
    const fd = new FormData();
    fd.append("audio", blob, "grabacion.webm");
    const { data } = await apiClient.post("/ai/transcribe", fd, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data?.text || "[transcripción simulada]";
  },

  async classifyRaw({ projectId, fileId, token }) {
    try {
      const { data } = await apiClient.post("/ai/actions",
        { action: "classify_raw", text: "", meta: { file_id: fileId } },
        { headers: { Authorization: `Bearer ${token}` } });
      return data;
    } catch { return { ok: false }; }
  },
 
  async actions({ action, text = "", meta = {}, token }) {
    const { data } = await apiClient.post(
      "/ai/actions",
      { action, text, meta },
      token ? { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } } : {}
    );
    return data;
  },



};