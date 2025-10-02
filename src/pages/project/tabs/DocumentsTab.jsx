import React from "react";
import { Link } from "react-router-dom";

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="p-3"><div className="h-4 w-48 bg-zinc-800 rounded"/></td>
    <td className="p-3"><div className="h-4 w-24 bg-zinc-800 rounded"/></td>
    <td className="p-3"><div className="h-4 w-16 bg-zinc-800 rounded"/></td>
    <td className="p-3 text-right"><div className="h-8 w-20 ml-auto bg-zinc-800 rounded"/></td>
  </tr>
);

export default function DocumentsTab({ projectId, documents, loadingDocs, onGenerate }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Documentos del Proyecto</h3>
        <button onClick={()=>onGenerate?.()} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">＋ Generar con IA</button>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <table className="w-full text-left text-zinc-300">
          <thead className="text-sm text-zinc-400 border-b border-zinc-800">
            <tr><th className="p-3">Título</th><th className="p-3">Tipo</th><th className="p-3">Versión</th><th className="p-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {loadingDocs ? (<><SkeletonRow/><SkeletonRow/><SkeletonRow/></>) :
             documents.length===0 ? (<tr><td className="p-6 text-zinc-500" colSpan="4">Aún no hay documentos.</td></tr>) :
             documents.map(doc=>(
              <tr key={doc.id} className="border-b border-zinc-800 hover:bg-zinc-900/30">
                <td className="p-3 font-semibold"><Link to={`/documents/${doc.id}`} className="text-purple-400 hover:text-purple-300">{doc.title}</Link></td>
                <td className="p-3 capitalize">{doc.document_type}</td>
                <td className="p-3">{doc.version}</td>
                <td className="p-3 text-right">
                  <Link to={`/documents/${doc.id}`} className="text-xs px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700">Abrir</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}