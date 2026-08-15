"use client";

import { Copy, Eye, Palette } from "lucide-react";
import { useMemo, useState } from "react";
import { contrastRatio, harmony, rgbToHsl } from "@/src/lib/color";
import { hexToRgb } from "@/src/lib/image";
import { copyText } from "@/src/lib/download";

export function ColorStudio() {
  const [color, setColor] = useState("#7C5CFF");
  const [background, setBackground] = useState("#0B1020");
  const rgb = hexToRgb(color) ?? { r: 124, g: 92, b: 255 };
  const hsl = rgbToHsl(rgb);
  const ratio = contrastRatio(color, background);
  const palette = useMemo(() => harmony(color), [color]);

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <label className="color-field"><span>Cor principal</span><div><input type="color" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())}/><input value={color} onChange={(e) => setColor(e.target.value.toUpperCase())}/></div></label>
        <div className="color-values"><button onClick={() => copyText(color)}><span>HEX</span><strong>{color}</strong><Copy size={14}/></button><button onClick={() => copyText(`${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}`)}><span>RGB</span><strong>{Math.round(rgb.r)} {Math.round(rgb.g)} {Math.round(rgb.b)}</strong><Copy size={14}/></button><button onClick={() => copyText(`${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`)}><span>HSL</span><strong>{Math.round(hsl.h)}° {Math.round(hsl.s)}% {Math.round(hsl.l)}%</strong><Copy size={14}/></button></div>
        <label className="color-field"><span>Fundo para contraste</span><div><input type="color" value={background} onChange={(e) => setBackground(e.target.value.toUpperCase())}/><input value={background} onChange={(e) => setBackground(e.target.value.toUpperCase())}/></div></label>
        <div className={`contrast-card ${ratio >= 4.5 ? "pass" : "fail"}`} style={{ color, background }}><Eye size={20}/><div><strong>Texto de exemplo</strong><span>Contraste {ratio.toFixed(2)}:1 · {ratio >= 4.5 ? "AA para texto normal" : ratio >= 3 ? "AA apenas para texto grande" : "contraste insuficiente"}</span></div></div>
      </section>
      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Sistema de cores</span><h2>Harmonias</h2></div></div>
        <div className="harmony-grid">{palette.map((hex, index) => <button key={`${hex}-${index}`} onClick={() => copyText(hex)}><span style={{ background: hex }}/><strong>{hex}</strong><small>{["Base", "Análoga +", "Análoga -", "Complementar", "Triádica +", "Triádica -"][index]}</small></button>)}</div>
        <div className="color-hero" style={{ background: `linear-gradient(135deg, ${color}, ${palette[3]})` }}><Palette size={28}/><strong>MediaForge Cores</strong><span>Pronto para UI, tokens e identidade visual.</span></div>
      </section>
    </div>
  );
}
