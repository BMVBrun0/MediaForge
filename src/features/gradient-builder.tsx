"use client";

import { Copy, Download, Pipette, WandSparkles } from "lucide-react";
import { useState } from "react";
import { copyText, downloadText } from "@/src/lib/download";

function GradientColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="gradient-color-field">
      <span>{label}</span>
      <div className="gradient-color-control">
        <span className="gradient-color-swatch" style={{ background: value }}>
          <input type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} aria-label={`Escolher ${label.toLowerCase()}`}/>
          <Pipette size={17}/>
        </span>
        <div>
          <strong>{value.toUpperCase()}</strong>
          <small>Clique na cor para escolher</small>
        </div>
      </div>
    </label>
  );
}

export function GradientBuilder() {
  const [first, setFirst] = useState("#7C5CFF");
  const [second, setSecond] = useState("#22B8FF");
  const [third, setThird] = useState("#20D6A3");
  const [angle, setAngle] = useState(135);
  const value = `linear-gradient(${angle}deg, ${first} 0%, ${second} 52%, ${third} 100%)`;
  const css = `.mediaforge-gradient {\n  background: ${value};\n}`;

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <div className="gradient-color-grid">
          <GradientColorField label="Cor 1" value={first} onChange={setFirst}/>
          <GradientColorField label="Cor 2" value={second} onChange={setSecond}/>
          <GradientColorField label="Cor 3" value={third} onChange={setThird}/>
        </div>
        <label className="range-field"><span>Ângulo <strong>{angle}°</strong></span><input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(Number(e.target.value))}/></label>
        <textarea className="code-area" readOnly value={css}/>
        <div className="button-row"><button className="primary-button" onClick={() => copyText(css)}><Copy size={16}/> Copiar CSS</button><button className="secondary-button" onClick={() => downloadText(css, "mediaforge-gradiente.css", "text/css")}><Download size={16}/> Baixar CSS</button></div>
      </section>
      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Gerador CSS</span><h2>Pré-visualização</h2></div></div>
        <div className="gradient-preview" style={{ background: value }}><WandSparkles size={34}/><strong>MediaForge</strong><span>{angle}° · 3 pontos de cor</span></div>
      </section>
    </div>
  );
}
