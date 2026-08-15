"use client";

import { Clapperboard, Download, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FileDrop } from "@/src/components/file-drop";
import { downloadBlob } from "@/src/lib/download";
import { formatBytes } from "@/src/lib/format";
import { canvasToBlob } from "@/src/lib/image";
import { processVideo } from "@/src/lib/ffmpeg";
import { saveArtifact } from "@/src/lib/history";

type Operation = "compress" | "convert" | "trim" | "audio" | "frame";
type VideoInfo = { duration: number; width: number; height: number };
type WidthLimit = 0 | 1280 | 1920;

function extensionOf(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "arquivo";
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function scaleFilter(limit: WidthLimit) {
  if (!limit) return [];
  return ["-vf", `scale=min\\(${limit}\\,iw\\):-2:flags=lanczos`];
}

async function readVideoInfo(file: File): Promise<VideoInfo | null> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<VideoInfo | null>((resolve) => {
      const video = document.createElement("video");
      const cleanup = () => { video.removeAttribute("src"); video.load(); };
      const timeout = window.setTimeout(() => { cleanup(); resolve(null); }, 8_000);
      video.preload = "metadata";
      video.muted = true;
      video.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        const info = { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
        cleanup();
        resolve(info);
      };
      video.onerror = () => { window.clearTimeout(timeout); cleanup(); resolve(null); };
      video.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function extractFrameNative(file: File, second: number) {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("O navegador não conseguiu abrir este vídeo para extrair o quadro."));
    });
    const target = Math.max(0, Math.min(Number.isFinite(video.duration) ? Math.max(0, video.duration - 0.05) : second, second));
    if (target > 0) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("Não foi possível navegar até o instante escolhido."));
        video.currentTime = target;
      });
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx || !canvas.width || !canvas.height) throw new Error("O vídeo não forneceu um quadro válido.");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvasToBlob(canvas, "image/jpeg", 0.94);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function VideoLab() {
  const [file, setFile] = useState<File | null>(null);
  const [operation, setOperation] = useState<Operation>("compress");
  const [format, setFormat] = useState("mp4");
  const [crf, setCrf] = useState(28);
  const [widthLimit, setWidthLimit] = useState<WidthLimit>(1920);
  const [start, setStart] = useState(0);
  const [duration, setDuration] = useState(10);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string; type: string } | null>(null);
  const source = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  const resultUrl = useMemo(() => result ? URL.createObjectURL(result.blob) : "", [result]);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source); }, [source]);
  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);

  const takeFile = async (next: File | null) => {
    setFile(next);
    setResult(null);
    setError("");
    setProgress(0);
    setLog("");
    setInfo(null);
    if (!next) return;
    setLog("Lendo informações do vídeo…");
    const nextInfo = await readVideoInfo(next);
    setInfo(nextInfo);
    setLog(nextInfo ? "Vídeo reconhecido e pronto para processamento." : "O navegador não conseguiu ler a pré-visualização; o mecanismo de vídeo ainda tentará processar o arquivo.");
    if (nextInfo?.duration && duration > nextInfo.duration) setDuration(Math.max(1, Math.floor(nextInfo.duration)));
  };

  const saveResult = async (blob: Blob, name: string, type: string) => {
    const typed = blob.type === type ? blob : new Blob([await blob.arrayBuffer()], { type });
    setResult({ blob: typed, name, type });
    await saveArtifact({
      toolId: "video-lab",
      title: `${operation} — ${file?.name ?? name}`,
      summary: `${file ? formatBytes(file.size) : ""} → ${formatBytes(typed.size)}`,
      outputName: name,
      outputType: type,
      outputSize: typed.size,
      blob: typed,
    });
  };

  const run = async () => {
    if (!file) return;
    setBusy(true); setError(""); setProgress(0); setLog("Preparando processamento…"); setResult(null);
    try {
      if (operation === "frame") {
        try {
          setLog("Extraindo quadro diretamente pelo navegador…");
          const blob = await extractFrameNative(file, start);
          await saveResult(blob, "mediaforge-quadro.jpg", "image/jpeg");
          setProgress(1);
          setLog("Quadro extraído com sucesso.");
          return;
        } catch {
          setLog("Extração nativa indisponível; tentando o mecanismo de vídeo local…");
        }
      }

      let name = "mediaforge-saida.mp4";
      let type = "video/mp4";
      let args: (input: string, output: string) => string[] = () => [];
      const videoScale = scaleFilter(widthLimit);
      const commonMp4 = ["-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-threads", "1"];
      const optionalAudio = ["-map", "0:v:0", "-map", "0:a?", "-c:a", "aac", "-b:a", "128k"];

      if (operation === "compress") {
        name = "mediaforge-comprimido.mp4"; type = "video/mp4";
        args = (input, output) => ["-i", input, ...optionalAudio, ...videoScale, ...commonMp4, "-crf", String(crf), output];
      } else if (operation === "convert") {
        if (format === "webm") {
          name = "mediaforge-convertido.webm"; type = "video/webm";
          args = (input, output) => ["-i", input, "-map", "0:v:0", "-map", "0:a?", ...videoScale, "-c:v", "libvpx", "-crf", "32", "-b:v", "0", "-deadline", "realtime", "-cpu-used", "8", "-threads", "1", "-c:a", "libopus", output];
        } else if (format === "gif") {
          name = "mediaforge-convertido.gif"; type = "image/gif";
          args = (input, output) => ["-i", input, "-an", "-vf", "fps=12,scale=min\\(960\\,iw\\):-2:flags=lanczos", output];
        } else {
          name = "mediaforge-convertido.mp4"; type = "video/mp4";
          args = (input, output) => ["-i", input, ...optionalAudio, ...videoScale, ...commonMp4, "-crf", "24", output];
        }
      } else if (operation === "trim") {
        name = "mediaforge-recorte.mp4"; type = "video/mp4";
        args = (input, output) => ["-ss", String(Math.max(0, start)), "-i", input, "-t", String(Math.max(0.1, duration)), ...optionalAudio, ...videoScale, ...commonMp4, "-crf", "24", output];
      } else if (operation === "audio") {
        name = "mediaforge-audio.wav"; type = "audio/wav";
        args = (input, output) => ["-i", input, "-map", "0:a:0", "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2", output];
      } else {
        name = "mediaforge-quadro.jpg"; type = "image/jpeg";
        args = (input, output) => ["-ss", String(Math.max(0, start)), "-i", input, "-frames:v", "1", "-q:v", "2", output];
      }

      const raw = await processVideo(file, args, name, (message) => setLog(message), setProgress);
      await saveResult(raw, name, type);
      setProgress(1);
      setLog("Processamento concluído.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "Falha ao processar o vídeo.";
      const friendly = operation === "audio" && /audio|stream|map|matches no streams/i.test(message)
        ? "Não foi encontrada uma faixa de áudio utilizável nesse vídeo. Capturas de tela podem ter sido gravadas sem áudio."
        : message;
      setError(friendly);
    } finally { setBusy(false); }
  };

  const maxStart = info?.duration && Number.isFinite(info.duration) ? Math.max(0, Math.floor(info.duration)) : undefined;
  const showResolution = operation === "compress" || operation === "trim" || (operation === "convert" && format !== "gif");
  const highResolution = Boolean(info?.width && info.width > 1920);

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <FileDrop accept="video/*,.webm,.mp4,.m4v,.mov,.ogv,.avi" onFiles={(files) => void takeFile(files[0] ?? null)} label="Selecione um vídeo" hint="MP4, WebM e formatos comuns; capturas de tela do Ubuntu em WebM são aceitas" />
        {file ? <div className="selected-file"><Clapperboard size={18}/><span><strong>{file.name}</strong><small>{formatBytes(file.size)} · {extensionOf(file).toUpperCase()}{info ? ` · ${info.width}×${info.height} · ${formatDuration(info.duration)}` : ""}</small></span></div> : null}
        <label><span>Operação</span><select value={operation} onChange={(e) => { setOperation(e.target.value as Operation); setResult(null); setError(""); }}><option value="compress">Comprimir para MP4 (H.264)</option><option value="convert">Converter formato</option><option value="trim">Cortar trecho e gerar MP4</option><option value="audio">Extrair áudio WAV</option><option value="frame">Extrair quadro JPG</option></select></label>
        {operation === "convert" ? <label><span>Formato de saída</span><select value={format} onChange={(e) => setFormat(e.target.value)}><option value="mp4">MP4 (H.264)</option><option value="webm">WebM (VP8)</option><option value="gif">GIF animado</option></select></label> : null}
        {showResolution ? <label><span>Limite de largura</span><select value={widthLimit} onChange={(e) => setWidthLimit(Number(e.target.value) as WidthLimit)}><option value="1920">Até 1920 px — recomendado</option><option value="1280">Até 1280 px — mais leve</option><option value="0">Manter resolução original</option></select><small>O limite evita estouro de memória em capturas 2K/4K. Imagens menores não são ampliadas.</small></label> : null}
        {operation === "compress" ? <label className="range-field"><span>Compressão CRF <strong>{crf}</strong></span><input type="range" min="20" max="38" value={crf} onChange={(e) => setCrf(Number(e.target.value))}/><small>Menor = mais qualidade e normalmente arquivo maior. 28 é um bom ponto inicial.</small></label> : null}
        {operation === "trim" || operation === "frame" ? <div className="form-grid"><label><span>Início (s)</span><input type="number" min="0" max={maxStart} step="0.1" value={start} onChange={(e) => setStart(Number(e.target.value))}/></label>{operation === "trim" ? <label><span>Duração (s)</span><input type="number" min="0.1" step="0.1" value={duration} onChange={(e) => setDuration(Number(e.target.value))}/></label> : null}</div> : null}
        <div className={`callout compact ${highResolution ? "warning-callout" : ""}`}><Clapperboard size={17}/><p>{highResolution ? `Este vídeo tem ${info?.width}px de largura. O limite de 1920 px está selecionado para tornar a conversão mais estável no navegador.` : "O processamento acontece no navegador. Na primeira execução, os componentes do mecanismo de vídeo são baixados e armazenados em cache."}</p></div>
        {operation === "convert" && format === "gif" ? <p className="field-note">GIF é gerado em até 960 px de largura para equilibrar compatibilidade, tamanho e tempo de processamento.</p> : null}
        {log ? <p className="video-status">{log.slice(-320)}</p> : null}
        {busy ? <div className="progress-block"><div><span>Processando</span><strong>{Math.round(progress * 100)}%</strong></div><progress max="1" value={progress}/></div> : null}
        {error ? <p className="error-box">{error}</p> : null}
        <button className="primary-button full" disabled={!file || busy} onClick={run}>{busy ? <><LoaderCircle className="spin" size={17}/> Processando…</> : "Executar processamento"}</button>
      </section>

      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Processamento local</span><h2>Resultado</h2></div>{result ? <button className="secondary-button" onClick={() => downloadBlob(result.blob, result.name)}><Download size={16}/> Baixar resultado</button> : null}</div>
        {result ? (
          result.type.startsWith("video/") ? <video className="video-preview" src={resultUrl} controls playsInline/> :
          result.type.startsWith("audio/") ? <div className="audio-result"><audio src={resultUrl} controls/><strong>{result.name}</strong><span>{formatBytes(result.blob.size)}</span></div> :
          <img className="video-frame-preview" src={resultUrl} alt="Resultado do processamento de vídeo"/>
        ) : source ? <video className="video-preview" src={source} controls playsInline/> : <div className="empty-preview large">Selecione um vídeo para visualizar e processar.</div>}
        {result ? <div className="metric-strip video-metrics"><div><span>Arquivo</span><strong>{result.name}</strong></div><div><span>Saída</span><strong>{formatBytes(result.blob.size)}</strong></div><div><span>Tipo</span><strong>{result.type}</strong></div><div><span>Status</span><strong>Concluído</strong></div></div> : null}
      </section>
    </div>
  );
}
