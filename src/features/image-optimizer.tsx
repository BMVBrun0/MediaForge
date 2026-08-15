"use client";

import { Download, Gauge, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { FileDrop } from "@/src/components/file-drop";
import { canvasFromFile, canvasToBlob } from "@/src/lib/image";
import { downloadBlob } from "@/src/lib/download";
import { formatBytes, formatPercent } from "@/src/lib/format";
import { saveArtifact } from "@/src/lib/history";

const SERVER_LIMIT = 4 * 1024 * 1024;

type OutputFormat = "jpeg" | "png" | "webp" | "avif";

function ext(format: OutputFormat) { return format === "jpeg" ? "jpg" : format; }

export function ImageOptimizer() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(82);
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [maxWidth, setMaxWidth] = useState(1920);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; url: string; width?: number; height?: number } | null>(null);

  const sourceUrl = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  const reduction = file && result ? ((file.size - result.blob.size) / file.size) * 100 : 0;

  const processLocal = async (input: File) => {
    const { canvas, width, height } = await canvasFromFile(input, maxWidth || undefined);
    const type = format === "jpeg" ? "image/jpeg" : format === "png" ? "image/png" : "image/webp";
    const blob = await canvasToBlob(canvas, type, quality / 100);
    return { blob, width, height };
  };

  const processServer = async (input: File) => {
    const form = new FormData();
    form.set("file", input);
    form.set("mode", "convert");
    form.set("quality", String(quality));
    form.set("outputFormat", format);
    if (maxWidth) form.set("maxWidth", String(maxWidth));
    const response = await fetch("/api/image/process", { method: "POST", body: form });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || "Não foi possível processar a imagem.");
    }
    const blob = await response.blob();
    return {
      blob,
      width: Number(response.headers.get("X-Output-Width") || 0) || undefined,
      height: Number(response.headers.get("X-Output-Height") || 0) || undefined,
    };
  };

  const run = async () => {
    if (!file) return;
    setBusy(true); setError("");
    if (result?.url) URL.revokeObjectURL(result.url);
    try {
      const output = format === "avif" && file.size <= SERVER_LIMIT ? await processServer(file) : await processLocal(file);
      const url = URL.createObjectURL(output.blob);
      setResult({ ...output, url });
      await saveArtifact({
        toolId: "image-optimize",
        title: `${file.name} → ${ext(format).toUpperCase()}`,
        summary: `${formatBytes(file.size)} → ${formatBytes(output.blob.size)} (${formatPercent(((file.size - output.blob.size) / file.size) * 100)} menor)`,
        outputName: `${file.name.replace(/\.[^.]+$/, "")}-mediaforge.${ext(format)}`,
        outputType: output.blob.type,
        outputSize: output.blob.size,
        blob: output.blob,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao processar a imagem.");
    } finally { setBusy(false); }
  };

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <FileDrop accept="image/png,image/jpeg,image/webp,image/avif" onFiles={(files) => { setFile(files[0] ?? null); setResult(null); }} />
        {file ? <div className="selected-file"><ImageIcon size={18} /><span><strong>{file.name}</strong><small>{formatBytes(file.size)}</small></span></div> : null}
        <div className="form-grid">
          <label><span>Formato de saída</span><select value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)}><option value="webp">WebP</option><option value="jpeg">JPEG</option><option value="png">PNG</option><option value="avif">AVIF</option></select></label>
          <label><span>Largura máxima</span><select value={maxWidth} onChange={(e) => setMaxWidth(Number(e.target.value))}><option value="0">Original</option><option value="1280">1280 px</option><option value="1920">1920 px</option><option value="2560">2560 px</option><option value="3840">3840 px</option></select></label>
        </div>
        <label className="range-field"><span>Qualidade <strong>{quality}%</strong></span><input type="range" min="45" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} /></label>
        <div className="callout compact"><Gauge size={17} /><p>AVIF usa a rota Node quando o arquivo cabe no limite da plataforma. JPEG, PNG e WebP podem ser processados diretamente no navegador.</p></div>
        {error ? <p className="error-box">{error}</p> : null}
        <button className="primary-button full" disabled={!file || busy} onClick={run}>{busy ? <><RefreshCw className="spin" size={17} /> Processando…</> : "Otimizar imagem"}</button>
      </section>

      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Resultado</span><h2>Antes e depois</h2></div>{result ? <button className="secondary-button" onClick={() => downloadBlob(result.blob, `${file?.name.replace(/\.[^.]+$/, "")}-mediaforge.${ext(format)}`)}><Download size={16} /> Baixar</button> : null}</div>
        <div className="image-preview-grid">
          <div><span>Original</span>{sourceUrl ? <img src={sourceUrl} alt="Original" /> : <div className="empty-preview">Selecione uma imagem</div>}</div>
          <div><span>Resultado</span>{result ? <img src={result.url} alt="Resultado otimizado" /> : <div className="empty-preview">O resultado aparece aqui</div>}</div>
        </div>
        {file && result ? <div className="metric-strip"><div><span>Original</span><strong>{formatBytes(file.size)}</strong></div><div><span>Saída</span><strong>{formatBytes(result.blob.size)}</strong></div><div><span>Redução</span><strong>{formatPercent(reduction)}</strong></div><div><span>Dimensão</span><strong>{result.width && result.height ? `${result.width}×${result.height}` : "—"}</strong></div></div> : null}
      </section>
    </div>
  );
}
