"use client";

import { CheckCircle2, Download, ScanSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FileDrop } from "@/src/components/file-drop";
import { canvasToBlob, fileToImage } from "@/src/lib/image";
import { downloadBlob } from "@/src/lib/download";
import { saveArtifact } from "@/src/lib/history";

type CompareMode = "layout" | "content";

type Rendered = { canvas: HTMLCanvasElement; data: ImageData };
type Box = { x: number; y: number; width: number; height: number };

function makeWorkingCanvas(image: HTMLImageElement, maxDimension = 1200) {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D indisponível.");
  ctx.drawImage(image, 0, 0, width, height);
  return { canvas, ctx, data: ctx.getImageData(0, 0, width, height) };
}

function findContentBox(image: ImageData): Box {
  const { width, height, data } = image;
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
  let br = 0, bg = 0, bb = 0, ba = 0;
  for (const [x, y] of corners) {
    const i = (y * width + x) * 4;
    br += data[i]; bg += data[i + 1]; bb += data[i + 2]; ba += data[i + 3];
  }
  br /= 4; bg /= 4; bb /= 4; ba /= 4;

  let minX = width, minY = height, maxX = -1, maxY = -1;
  const threshold = 26;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      const alphaDifferent = Math.abs(a - ba) > 18;
      const rgbDistance = Math.sqrt((data[i] - br) ** 2 + (data[i + 1] - bg) ** 2 + (data[i + 2] - bb) ** 2);
      const visibleContent = a > 20 && (alphaDifferent || rgbDistance > threshold);
      if (!visibleContent) continue;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return { x: 0, y: 0, width, height };
  const padX = Math.max(2, Math.round((maxX - minX + 1) * 0.035));
  const padY = Math.max(2, Math.round((maxY - minY + 1) * 0.035));
  const x = Math.max(0, minX - padX);
  const y = Math.max(0, minY - padY);
  const right = Math.min(width, maxX + 1 + padX);
  const bottom = Math.min(height, maxY + 1 + padY);
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
}

function renderForComparison(image: HTMLImageElement, mode: CompareMode, width: number, height: number): Rendered {
  const source = makeWorkingCanvas(image);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D indisponível.");
  ctx.clearRect(0, 0, width, height);

  if (mode === "layout") {
    const globalScale = Math.min(width / source.canvas.width, height / source.canvas.height);
    const drawWidth = source.canvas.width * globalScale;
    const drawHeight = source.canvas.height * globalScale;
    ctx.drawImage(source.canvas, 0, 0, source.canvas.width, source.canvas.height, 0, 0, drawWidth, drawHeight);
  } else {
    const box = findContentBox(source.data);
    const padding = Math.max(24, Math.round(Math.min(width, height) * 0.06));
    const scale = Math.min((width - padding * 2) / box.width, (height - padding * 2) / box.height);
    const drawWidth = box.width * scale;
    const drawHeight = box.height * scale;
    const dx = (width - drawWidth) / 2;
    const dy = (height - drawHeight) / 2;
    ctx.drawImage(source.canvas, box.x, box.y, box.width, box.height, dx, dy, drawWidth, drawHeight);
  }

  return { canvas, data: ctx.getImageData(0, 0, width, height) };
}

function resultLabel(percent: number) {
  if (percent < 0.2) return "Praticamente idênticas";
  if (percent < 3) return "Mudanças muito pequenas";
  if (percent < 12) return "Mudanças localizadas";
  if (percent < 35) return "Diferença relevante";
  return "Imagens muito diferentes";
}

export function ImageCompare() {
  const [left, setLeft] = useState<File | null>(null);
  const [right, setRight] = useState<File | null>(null);
  const [slider, setSlider] = useState(50);
  const [threshold, setThreshold] = useState(18);
  const [mode, setMode] = useState<CompareMode>("content");
  const [difference, setDifference] = useState<number | null>(null);
  const [diffBlob, setDiffBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const leftUrl = useMemo(() => left ? URL.createObjectURL(left) : "", [left]);
  const rightUrl = useMemo(() => right ? URL.createObjectURL(right) : "", [right]);
  const diffUrl = useMemo(() => diffBlob ? URL.createObjectURL(diffBlob) : "", [diffBlob]);
  useEffect(() => () => { if (leftUrl) URL.revokeObjectURL(leftUrl); }, [leftUrl]);
  useEffect(() => () => { if (rightUrl) URL.revokeObjectURL(rightUrl); }, [rightUrl]);
  useEffect(() => () => { if (diffUrl) URL.revokeObjectURL(diffUrl); }, [diffUrl]);

  const resetResult = () => { setDifference(null); setDiffBlob(null); setError(""); };

  const analyze = async () => {
    if (!left || !right) return;
    setBusy(true); setError("");
    try {
      const [a, b] = await Promise.all([fileToImage(left), fileToImage(right)]);
      let width: number;
      let height: number;
      if (mode === "content") {
        width = 900;
        height = 900;
      } else {
        const maxWidth = Math.max(a.naturalWidth, b.naturalWidth);
        const maxHeight = Math.max(a.naturalHeight, b.naturalHeight);
        const scale = Math.min(1, 1100 / Math.max(maxWidth, maxHeight));
        width = Math.max(1, Math.round(maxWidth * scale));
        height = Math.max(1, Math.round(maxHeight * scale));
      }

      const aa = renderForComparison(a, mode, width, height);
      const bb = renderForComparison(b, mode, width, height);
      const out = new ImageData(width, height);
      const limit = Math.max(1, threshold);
      let changed = 0;
      let visible = 0;
      let minX = width, minY = height, maxX = -1, maxY = -1;

      for (let i = 0; i < aa.data.data.length; i += 4) {
        const ar = aa.data.data[i], ag = aa.data.data[i + 1], ab = aa.data.data[i + 2], alphaA = aa.data.data[i + 3];
        const br = bb.data.data[i], bg = bb.data.data[i + 1], bbv = bb.data.data[i + 2], alphaB = bb.data.data[i + 3];
        const unionAlpha = Math.max(alphaA, alphaB);
        if (unionAlpha < 8) {
          out.data[i] = 9; out.data[i + 1] = 13; out.data[i + 2] = 24; out.data[i + 3] = 255;
          continue;
        }

        visible += 1;
        const rgbDelta = Math.max(Math.abs(ar - br), Math.abs(ag - bg), Math.abs(ab - bbv));
        const alphaDelta = Math.abs(alphaA - alphaB);
        const delta = Math.max(rgbDelta, alphaDelta);
        const pixel = i / 4;
        const x = pixel % width;
        const y = Math.floor(pixel / width);

        if (delta >= limit) {
          changed += 1;
          minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
          const intensity = Math.min(1, delta / 150);
          out.data[i] = 255;
          out.data[i + 1] = Math.round(150 - intensity * 90);
          out.data[i + 2] = 35;
          out.data[i + 3] = 255;
        } else {
          const gray = Math.round((ar * 0.2126 + ag * 0.7152 + ab * 0.0722) * 0.28 + 18);
          out.data[i] = gray; out.data[i + 1] = gray; out.data[i + 2] = gray; out.data[i + 3] = 255;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D indisponível.");
      ctx.putImageData(out, 0, 0);
      if (maxX >= minX && maxY >= minY) {
        ctx.strokeStyle = "#ffcc66";
        ctx.lineWidth = Math.max(2, Math.round(Math.min(width, height) / 300));
        ctx.strokeRect(minX + 1, minY + 1, Math.max(1, maxX - minX - 1), Math.max(1, maxY - minY - 1));
      }

      const blob = await canvasToBlob(canvas, "image/png");
      const percent = visible ? (changed / visible) * 100 : 0;
      setDifference(percent);
      setDiffBlob(blob);
      await saveArtifact({
        toolId: "image-compare",
        title: `${left.name} × ${right.name}`,
        summary: `${percent.toFixed(2)}% alterado · ${mode === "content" ? "conteúdo normalizado" : "layout exato"}`,
        outputName: "mediaforge-image-diff.png",
        outputType: "image/png",
        outputSize: blob.size,
        blob,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível comparar as imagens.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <div className="dual-drop compare-upload-grid">
          <div className={`compare-upload-slot ${left ? "has-file" : ""}`}>
            <FileDrop accept="image/*" label={left ? "Versão A carregada" : "Versão A"} hint={left ? "Clique para substituir a imagem de referência" : "Imagem de referência"} onFiles={(files) => { setLeft(files[0] ?? null); resetResult(); }}/>
            {left && leftUrl ? <div className="compare-upload-preview"><img src={leftUrl} alt="Miniatura da versão A"/><div><span><CheckCircle2 size={15}/> Arquivo carregado</span><strong>{left.name}</strong><small>{Math.round(left.size / 1024)} KB</small></div></div> : null}
          </div>
          <div className={`compare-upload-slot ${right ? "has-file" : ""}`}>
            <FileDrop accept="image/*" label={right ? "Versão B carregada" : "Versão B"} hint={right ? "Clique para substituir a imagem que será comparada" : "Imagem para comparar"} onFiles={(files) => { setRight(files[0] ?? null); resetResult(); }}/>
            {right && rightUrl ? <div className="compare-upload-preview"><img src={rightUrl} alt="Miniatura da versão B"/><div><span><CheckCircle2 size={15}/> Arquivo carregado</span><strong>{right.name}</strong><small>{Math.round(right.size / 1024)} KB</small></div></div> : null}
          </div>
        </div>

        <label><span>Tipo de comparação</span><select value={mode} onChange={(e) => { setMode(e.target.value as CompareMode); resetResult(); }}><option value="content">Conteúdo normalizado — logos, ícones e artes</option><option value="layout">Layout exato — screenshots e telas</option></select></label>
        <div className="callout compact"><ScanSearch size={17}/><p>{mode === "content" ? "Remove automaticamente margens externas, preserva proporção e centraliza o conteúdo antes da comparação. Ideal para a mesma logo salva em tamanhos diferentes." : "Mantém posição e escala relativas. Ideal para duas capturas da mesma tela em que qualquer deslocamento deve contar como mudança."}</p></div>
        <label className="range-field"><span>Limiar de diferença <strong>{threshold}</strong></span><input type="range" min="3" max="80" value={threshold} onChange={(e) => { setThreshold(Number(e.target.value)); resetResult(); }}/><small>Menor = detecta alterações mais sutis. Maior = ignora pequenas diferenças de compressão/antialiasing.</small></label>
        {error ? <p className="error-box">{error}</p> : null}
        <button className="primary-button full" disabled={!left || !right || busy} onClick={analyze}><ScanSearch size={17}/> {busy ? "Comparando…" : "Analisar diferenças"}</button>
        {difference !== null ? <div className="diff-metrics"><div><span>Alteração</span><strong>{difference.toFixed(2)}%</strong></div><div><span>Similaridade</span><strong>{Math.max(0, 100 - difference).toFixed(2)}%</strong></div><p>{resultLabel(difference)}</p></div> : null}
      </section>

      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Comparação visual</span><h2>Comparação interativa</h2></div>{diffBlob ? <button className="secondary-button" onClick={() => downloadBlob(diffBlob, "mediaforge-image-diff.png")}><Download size={16}/> Baixar mapa de diferenças</button> : null}</div>
        {leftUrl && rightUrl ? <><div className="compare-stage"><img src={leftUrl} alt="Versão A"/><div className="compare-overlay" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}><img src={rightUrl} alt="Versão B"/></div><span className="compare-label left">A</span><span className="compare-label right">B</span><span className="compare-line" style={{ left: `${slider}%` }}/></div><input className="compare-slider" aria-label="Divisor entre versão A e B" type="range" min="0" max="100" value={slider} onChange={(e) => setSlider(Number(e.target.value))}/></> : <div className="empty-preview large">Selecione duas imagens para comparar</div>}
        {diffUrl ? <div className="diff-map-card"><div><strong>Mapa de alterações</strong><span>Laranja/vermelho = pixels diferentes. Cinza escuro = regiões equivalentes.</span></div><img src={diffUrl} alt="Mapa visual das diferenças"/></div> : null}
      </section>
    </div>
  );
}
