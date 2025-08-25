// src/components/MermaidChart.jsx
import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

// Configuración inicial de Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

const MermaidChart = ({ chart }) => {
  const [svg, setSvg] = useState('');

  useEffect(() => {
    const renderChart = async () => {
      try {
        const { svg: svgCode } = await mermaid.render('mermaid-chart', chart);
        setSvg(svgCode);
      } catch (e) {
        console.error("Error rendering Mermaid chart:", e);
      }
    };
    if (chart) {
      renderChart();
    }
  }, [chart]);

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default MermaidChart;