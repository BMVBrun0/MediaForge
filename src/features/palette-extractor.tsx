"use client";

import { Copy, Download, Palette } from "lucide-react";
import { useMemo, useState } from "react";
import { FileDrop } from "@/src/components/file-drop";
import { canvasFromFile, rgbToHex } from "@/src/lib/image";
import { copyText, downloadText } from "@/src/lib/download";
import { saveArtifact } from "@/src/lib/history";

interface ColorEntry { hex: string; count: number }

function extractColors(data: Uint8ClampedArray, count = 8): ColorEntry[] {
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 150) continue;
    const r = Math.round(data[i] / 24) * 24;
    const g = Math.round(data[i + 1] / 24) * 24;
    const b = Math.round(data[i + 2] / 24) * 24;
    const key = `${r}-${g}-${b}`;
    const item = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    item.r += data[i]; item.g += data[i + 1]; item.b += data[i + 2]; item.count += 1;
    buckets.set(key, item);
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, count).map((item) => ({ hex: rgbToHex({ r: item.r / item.count, g: item.g / item.count, b: item.b / item.count }), count: item.count }));
}

export function PaletteExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [colors, setColors] = useState<ColorEntry[]>([]);
  const source = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);

  const analyze = async (input: File) => {
    setFile(input);
    const { context, width, height } = await canvasFromFile(input, 180);
    const result = extractColors(context.getImageData(0, 0, width, height).data);
    setColors(result);
    await saveArtifact({ toolId: "palette-extract", title: `Paleta — ${input.name}`, summary: result.map((color) => color.hex).join(" · ") });
  };

  const css = colors.map((color, index) => `  --mediaforge-color-${index + 1}: ${color.hex};`).join("\n");
  const cssFile = `:root {\n${css}\n}`;

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <FileDrop accept="image/*" onFiles={(files) => files[0] && analyze(files[0])} />
        <div className="callout compact"><Palette size={17}/><p>A amostragem reduz a imagem no navegador e agrupa cores próximas para encontrar uma paleta dominante sem enviar o arquivo.</p></div>
        {colors.length ? <div className="palette-actions"><button className="secondary-button" onClick={() => copyText(cssFile)}><Copy size={16}/> Copiar CSS</button><button className="secondary-button" onClick={() => downloadText(cssFile, "mediaforge-palette.css", "text/css")}><Download size={16}/> Baixar CSS</button></div> : null}
      </section>
      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Extração de cores</span><h2>Paleta dominante</h2></div></div>
        {source ? <img className="palette-source" src={source} alt="Imagem analisada"/> : <div className="empty-preview">Selecione uma imagem</div>}
        <div className="palette-grid">{colors.map((color) => <button key={color.hex} className="color-chip" onClick={() => copyText(color.hex)}><span style={{ background: color.hex }}/><strong>{color.hex}</strong><small>Clique para copiar</small></button>)}</div>
      </section>
    </div>
  );
}
