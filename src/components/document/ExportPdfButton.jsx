import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ExportPdfButton({ scopeSelector=".ndoc-export-scope", filename="documento" }) {
  const handleExportPDF = async () => {
    const node = document.querySelector(scopeSelector); if (!node) return;
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#0d1117" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
    const pageW = pdf.internal.pageSize.getWidth(); const pageH = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(18, 18, 24); pdf.rect(0,0,pageW,56,"F");
    pdf.setTextColor(255,255,255); pdf.setFontSize(12); pdf.text("NuminaDocs · n100f",36,34);
    const margin = 24, usableW = pageW - margin*2; const ratio = canvas.height/canvas.width;
    const imgW = usableW, imgH = imgW*ratio; let y = 70;
    if (imgH < pageH - y - 60) {
      pdf.addImage(img, "PNG", margin, y, imgW, imgH, "", "FAST");
    } else {
      let rem = imgH, sy=0, sliceH=pageH-y-60;
      while (rem>0) {
        pdf.addImage(img,"PNG",margin,y,imgW,imgH,"","FAST",0,sy/imgH,1,sliceH/imgH);
        rem-=sliceH; sy+=sliceH;
        if (rem>0) { pdf.addPage(); pdf.setFillColor(18,18,24); pdf.rect(0,0,pageW,56,"F"); pdf.setTextColor(255,255,255); pdf.setFontSize(12); pdf.text("NuminaDocs · n100f",36,34); }
      }
    }
    const fy = pageH-28; pdf.setDrawColor(139,92,246); pdf.setLineWidth(0.6);
    pdf.line(36,fy-12,pageW-36,fy-12); pdf.setTextColor(139,92,246); pdf.setFontSize(10);
    pdf.text("Documento generado por NuminaDocs · confidencial",36,fy);
    pdf.save(`${filename.replace(/\s+/g,"_")}.pdf`);
  };
  return <button onClick={handleExportPDF} className="px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 font-semibold">Exportar PDF</button>;
}