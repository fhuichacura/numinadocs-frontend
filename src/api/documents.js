// src/api/documents.js
import apiClient from "./axios";

export const documentsApi = {
  async byProject(projectId, token) {
    const { data } = await apiClient.get(`/documents/by_project/${projectId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async get(documentId, token) {
    const { data } = await apiClient.get(`/documents/${documentId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  },

  async create(payload, token) {
    const { data } = await apiClient.post(`/documents/`, payload, {
      headers: token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : {},
    });
    return data;
  },

  async update(documentId, payload, token) {
    const { data } = await apiClient.put(`/documents/${documentId}`, payload, {
      headers: token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : {},
    });
    return data;
  },

  async remove(documentId, token) {
    await apiClient.delete(`/documents/${documentId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  // 🚀 Genera documento a partir de un RAW (según tipo)
  async generateFromRaw(projectId, fileId, kind = "technical", token) {
    const { data } = await apiClient.post(
      `/documents/generate_from_raw`,
      { project_id: projectId, file_id: fileId, kind },
      {
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : {},
      }
    );
    // backend debe devolver {id}, validamos
    if (!data || !data.id) {
      throw new Error("Respuesta inválida del backend (faltó id)");
    }
    return data; // { id }
  },
};