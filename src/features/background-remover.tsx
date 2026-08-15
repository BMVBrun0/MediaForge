"use client";

import { Download, Pipette, RefreshCw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { FileDrop } from "@/src/components/file-drop";
import { averageBorderColor, canvasFromFile, canvasToBlob, hexToRgb, removeEdgeConnectedBackground, rgbToHex } from "@/src/lib/image";
import { downloadBlob } from "@/src/lib/download";
import { saveArtifact } from "@/src/lib/history";

export function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [tolerance, setTolerance] = useState(42);
  const [softness, setSoftness] = useState(28);
  const [background, setBackground] = useState("#FFFFFF");
  const [auto, setAuto] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState("");
  const source = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);

  const run = async () => {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const { canvas, context, width, height } = await canvasFromFile(file, 2400);
      const imageData = context.getImageData(0, 0, width, height);
      const bg = auto ? averageBorderColor(imageData, Math.max(6, Math.round(Math.min(width, height) * 0.02))) : hexToRgb(background);
      if (!bg) throw new Error("Cor de fundo inválida.");
      if (auto) setBackground(rgbToHex(bg));
      context.putImageData(removeEdgeConnectedBackground(imageData, bg, tolerance, softness), 0, 0);
      const blob = await canvasToBlob(canvas, "image/png");
      const url = URL.createObjectURL(blob);
      setResult({ blob, url });
      await saveArtifact({ toolId: "background-remove", title: `Fundo removido — ${file.name}`, summary: `PNG transparente · tolerância ${tolerance} · suavização ${softness}`, outputName: `${file.name.replace(/\.[^.]+$/, "")}-transparent.png`, outputType: "image/png", outputSize: blob.size, blob });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao remover o fundo."); }
    finally { setBusy(false); }
  };

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <FileDrop accept="image/png,image/jpeg,image/webp" onFiles={(files) => { setFile(files[0] ?? null); setResult(null); }} />
        <div className="segmented"><button className={auto ? "active" : ""} onClick={() => setAuto(true)}><Sparkles size={15}/> Detectar pelas bordas</button><button className={!auto ? "active" : ""} onClick={() => setAuto(false)}><Pipette size={15}/> Escolher cor</button></div>
        <label className="color-field"><span>Cor estimada do fundo</span><div><input type="color" value={background} disabled={auto} onChange={(e) => setBackground(e.target.value)} /><input value={background} disabled={auto} onChange={(e) => setBackground(e.target.value)} /></div></label>
        <label className="range-field"><span>Tolerância <strong>{tolerance}</strong></span><input type="range" min="8" max="120" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))}/></label>
        <label className="range-field"><span>Suavização da borda <strong>{softness}</strong></span><input type="range" min="1" max="90" value={softness} onChange={(e) => setSoftness(Number(e.target.value))}/></label>
        <div className="callout compact"><Sparkles size={17}/><p>O algoritmo parte das bordas e remove apenas regiões conectadas semelhantes ao fundo, preservando melhor cores parecidas dentro do objeto.</p></div>
        {error ? <p className="error-box">{error}</p> : null}
        <button className="primary-button full" disabled={!file || busy} onClick={run}>{busy ? <><RefreshCw className="spin" size={17}/> Processando…</> : "Gerar PNG transparente"}</button>
      </section>
      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Canal alpha</span><h2>Pré-visualização</h2></div>{result ? <button className="secondary-button" onClick={() => downloadBlob(result.blob, `${file?.name.replace(/\.[^.]+$/, "")}-transparent.png`)}><Download size={16}/> Baixar PNG</button> : null}</div>
        <div className="transparent-preview">{result ? <img src={result.url} alt="Imagem com fundo transparente"/> : source ? <img src={source} alt="Imagem original"/> : <div className="empty-preview">Selecione uma imagem com fundo relativamente uniforme</div>}</div>
      </section>
    </div>
  );
}
