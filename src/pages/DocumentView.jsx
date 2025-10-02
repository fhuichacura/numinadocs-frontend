// src/pages/DocumentView.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axios";
import Modal from "react-modal";
import MermaidChart from "../components/MermaidChart";
import AICompanionPanel from "../components/AICompanionPanel";
import ExportPdfButton from "../components/document/ExportPdfButton";

Modal.setAppElement("#root");

const SaveAsTemplateForm = ({ documentId, closeModal }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const res = await apiClient.post("/templates/from_document",
        { document_id: documentId, name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      closeModal(); navigate(`/templates/${res.data.id}`);
    } catch { alert("No se pudo guardar la plantilla."); } finally { setIsSubmitting(false); }
  };
  return (
    <form onSubmit={submit} className="p-4 space-y-4 text-white">
      <h3 className="text-xl font-semibold">Guardar como Plantilla Nueva</h3>
      <input type="text" placeholder="Nombre de la nueva plantilla" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 bg-gray-800 rounded-md" />
      <textarea placeholder="Descripción corta (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 bg-gray-800 rounded-md h-24"></textarea>
      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold disabled:bg-gray-500">
          {isSubmitting ? "Guardando..." : "Guardar Plantilla"}
        </button>
      </div>
    </form>
  );
};

function DocumentRenderer({ content, isEditing, onContentChange }) {
  const sections = content?.sections || [];
  const handleSectionChange = (index, newText) => {
    const newSections = [...sections]; newSections[index].text = newText; onContentChange({ sections: newSections });
  };
  return (
    <div className="prose prose-invert max-w-none text-gray-300">
      {sections.map((section, i) => {
        if (section.type === "heading") {
          return isEditing ? (
            <input key={i} type="text" value={section.text} onChange={(e) => handleSectionChange(i, e.target.value)} className="w-full bg-gray-700 text-2xl font-bold text-white mt-6 mb-3 p-2 rounded-md"/>
          ) : (<h2 key={i} className="text-2xl font-bold text-white mt-6 mb-3">{section.text}</h2>);
        }
        if (section.type === "paragraph") {
          return isEditing ? (
            <textarea key={i} value={section.text} onChange={(e) => handleSectionChange(i, e.target.value)} className="w-full bg-gray-700 mb-4 p-2 rounded-md h-auto text-gray-200" rows={Math.max(5, (section.text || "").split("\n").length)} />
          ) : (<p key={i} className="mb-4 leading-relaxed whitespace-pre-wrap">{section.text}</p>);
        }
        if (section.type === "mermaid") {
          return isEditing ? (
            <div key={i} className="my-4">
              <label className="text-sm text-gray-400">Código del Diagrama (Mermaid)</label>
              <textarea value={section.text} onChange={(e) => handleSectionChange(i, e.target.value)} className="w-full bg-gray-900 text-cyan-300 font-mono text-sm p-4 rounded-md h-48" />
            </div>
          ) : (
            <div key={i} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 my-4 flex justify-center">
              <MermaidChart chart={section.text} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function DocumentView() {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState({ sections: [] });
  const [selectedText, setSelectedText] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { documentId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchDocument = async () => {
    if (!token || !documentId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/documents/${documentId}`, { headers: { Authorization: `Bearer ${token}` } });
      setDocument(response.data);
      setEditedTitle(response.data.title);
      setEditedContent(response.data.content_full || { sections: [] });
    } catch (error) {
      console.error("Error al cargar el documento:", error);
      setDocument(null);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchDocument(); }, [documentId, token]);

  const handleSave = async () => {
    try {
      setIsAILoading(true);
      await apiClient.put(`/documents/${documentId}`, { title: editedTitle, content_full: editedContent }, { headers: { Authorization: `Bearer ${token}` } });
      setIsEditing(false); await fetchDocument();
    } catch (e) { console.error("Error al guardar:", e); } finally { setIsAILoading(false); }
  };

  const handleAIAction = async (action, textOverride = "") => {
    const textToProcess = textOverride || selectedText;
    if (!textToProcess) return;
    setIsAILoading(true);
    try {
      const payload = { action, text: textToProcess, context: JSON.stringify(editedContent) };
      const response = await apiClient.post("/ai-actions/", payload, { headers: { Authorization: `Bearer ${token}` } });
      const generatedText = response.data.generated_text;
      if (action === "mermaid") {
        const newSection = { type: "mermaid", text: generatedText };
        setEditedContent(prev => ({ ...prev, sections: [...(prev?.sections || []), newSection] }));
      } else {
        const currentContentStr = JSON.stringify(editedContent);
        const newContentStr = currentContentStr.replace(textToProcess, generatedText);
        setEditedContent(JSON.parse(newContentStr));
      }
      setSelectedText("");
    } catch (e) {
      console.error("Error en la acción de IA:", e); alert("La acción de IA ha fallado.");
    } finally { setIsAILoading(false); }
  };

  if (loading) return <p className="text-gray-400 text-center py-10">Cargando documento…</p>;
  if (!document) {
    return (
      <div className="text-center p-8 bg-gray-800 rounded-lg">
        <h1 className="text-2xl font-bold text-red-400">Error al Cargar el Documento</h1>
        <p className="text-gray-400 mt-4">No se pudo encontrar o cargar el contenido del documento.</p>
        <Link to="/dashboard" className="mt-6 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">&larr; Volver al Dashboard</Link>
      </div>
    );
  }

  const isErrorState = document.content_full?.sections?.[0]?.text?.startsWith?.("Error al Generar Documento");

  return (
    <>
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 h-full ${isAILoading ? "opacity-50 cursor-not-allowed" : ""}`}>
        <div className="lg:col-span-2 bg-gray-800 p-8 rounded-lg ndoc-export-scope">
          <div className="flex justify-between items-center mb-8">
            {isEditing ? (
              <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="text-4xl font-bold text-white bg-gray-700 p-2 rounded-md w-2/3"/>
            ) : ( <h1 className="text-4xl font-bold text-white">{document.title}</h1> )}

            <div className="flex items-center gap-3">
              <ExportPdfButton filename={document.title || "documento"} />
              <button onClick={() => setModalIsOpen(true)} title="Guardar como Plantilla" className="px-3 py-2 bg-zinc-800 hover:bg-purple-600 rounded-md text-gray-300 hover:text-white transition-colors">
                Guardar Plantilla
              </button>
              {!isErrorState && (
                isEditing ? (
                  <div className="flex gap-3">
                    <button onClick={() => { setIsEditing(false); setEditedContent(document.content_full); setEditedTitle(document.title); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">Guardar</button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">Editar</button>
                )
              )}
            </div>
          </div>

          {isErrorState ? (
            <div className='bg-gray-900/50 p-6 rounded-lg'>
              <h2 className='text-xl font-bold text-red-400 mb-2'>Error al Generar Documento</h2>
              <p className='text-gray-400 mb-6'>La IA no pudo procesar la solicitud. Puedes revisar tus apuntes e intentarlo de nuevo.</p>
              <div className='border-t border-gray-700 pt-4'>
                <p className='text-sm text-gray-500 mb-2'>Notas originales:</p>
                <p className='text-gray-300 whitespace-pre-wrap bg-gray-800 p-2 rounded-md'>{document.content_summary}</p>
              </div>
              <button onClick={async () => {
                try { setIsAILoading(true); await apiClient.post(`/documents/${documentId}/regenerate`, {}, { headers: { Authorization: `Bearer ${token}` } }); await fetchDocument(); }
                catch { alert("La regeneración falló."); }
                finally { setIsAILoading(false); }
              }} className="mt-6 w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">
                {isAILoading ? "Regenerando…" : "Volver a Generar con IA"}
              </button>
            </div>
          ) : (
            <DocumentRenderer content={editedContent} isEditing={isEditing} onContentChange={setEditedContent} />
          )}
        </div>
        <div className="lg:col-span-1">
          <AICompanionPanel selectedText={selectedText} onAction={handleAIAction} />
        </div>
      </div>

      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} style={{ content: { top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#1f2937', border:'1px solid #4b5563', borderRadius:'1rem', width:'90%', maxWidth:500 }, overlay: { backgroundColor:'rgba(0,0,0,0.75)' } }}>
        <SaveAsTemplateForm documentId={documentId} closeModal={() => setModalIsOpen(false)} />
      </Modal>
    </>
  );
}