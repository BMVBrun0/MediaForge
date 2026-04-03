"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type ProcessingMode = "compress" | "convert";
type OutputFormat = "auto" | "jpeg" | "png" | "webp" | "avif";

type QueueStatus = "idle" | "processing" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  sourceUrl: string;
  resultUrl?: string;
  resultBlob?: Blob;
  resultName?: string;
  resultType?: string;
  resultSize?: number;
  width?: number;
  height?: number;
  reduction?: number;
  status: QueueStatus;
  error?: string;
}

interface HistoryRecord {
  id: string;
  name: string;
  createdAt: string;
  outputFormat: string;
  mode: ProcessingMode;
  originalSize: number;
  outputSize: number;
  width?: number;
  height?: number;
  outputType: string;
  blob: Blob;
}

const HISTORY_DB_NAME = "mediaforge";
const HISTORY_STORE_NAME = "history";

const FORMAT_OPTIONS: Array<{
  value: OutputFormat;
  label: string;
  helper: string;
}> = [
  { value: "auto", label: "Automático", helper: "Mantém o formato original sempre que possível" },
  { value: "jpeg", label: "JPEG", helper: "Bom para fotos e ampla compatibilidade" },
  { value: "png", label: "PNG", helper: "Ideal quando transparência importa" },
  { value: "webp", label: "WebP", helper: "Ótimo equilíbrio entre peso e qualidade" },
  { value: "avif", label: "AVIF", helper: "Compressão forte em navegadores modernos" },
];

const PRESETS = [
  {
    id: "web",
    label: "Web leve",
    description: "Landing pages, blog e upload rápido",
    mode: "compress" as ProcessingMode,
    quality: 78,
    format: "webp" as OutputFormat,
    maxWidth: 1600,
    maxHeight: 1600,
  },
  {
    id: "portfolio",
    label: "Portfólio",
    description: "Mais qualidade para apresentação",
    mode: "convert" as ProcessingMode,
    quality: 88,
    format: "webp" as OutputFormat,
    maxWidth: 2200,
    maxHeight: 2200,
  },
  {
    id: "produto",
    label: "Produto",
    description: "Boa nitidez com peso controlado",
    mode: "convert" as ProcessingMode,
    quality: 84,
    format: "jpeg" as OutputFormat,
    maxWidth: 1800,
    maxHeight: 1800,
  },
  {
    id: "rapido",
    label: "Processo rápido",
    description: "Prioriza velocidade e tamanho menor",
    mode: "compress" as ProcessingMode,
    quality: 72,
    format: "auto" as OutputFormat,
    maxWidth: 1280,
    maxHeight: 1280,
  },
];

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 16V5m0 0-4 4m4-4 4 4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Zm6 11 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16M4 12h10M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3v10m0 0 4-4m-4 4-4-4M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16m-11 4v6m6-6v6M9 7l1-2h4l1 2m-7 0 1 11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m13 2-8 11h6l-1 9 9-13h-6l0-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value < 10 && unitIndex > 0 ? value.toFixed(1) : Math.round(value)} ${units[unitIndex]}`;
}

function formatOutputLabel(mode: ProcessingMode) {
  return mode === "compress" ? "Compactar" : "Converter";
}

function getFileBaseName(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot === -1 ? fileName : fileName.slice(0, lastDot);
}

function getExtensionFromFormat(format: OutputFormat, originalType: string) {
  if (format !== "auto") {
    return format === "jpeg" ? "jpg" : format;
  }

  if (originalType.includes("png")) return "png";
  if (originalType.includes("jpeg") || originalType.includes("jpg")) return "jpg";
  if (originalType.includes("webp")) return "webp";
  if (originalType.includes("avif")) return "avif";
  return "jpg";
}

function fileToQueueItem(file: File): QueueItem {
  return {
    id: crypto.randomUUID(),
    file,
    sourceUrl: URL.createObjectURL(file),
    status: "idle",
  };
}

async function readImageDimensions(blob: Blob) {
  if (typeof window === "undefined" || !blob.type.startsWith("image/")) {
    return { width: undefined, height: undefined };
  }

  const url = URL.createObjectURL(blob);

  try {
    const dimensions = await new Promise<{ width?: number; height?: number }>((resolve) => {
      const image = new Image();

      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      };

      image.onerror = () => {
        resolve({ width: undefined, height: undefined });
      };

      image.src = url;
    });

    return dimensions;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function openHistoryDb() {
  return await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(HISTORY_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
        db.createObjectStore(HISTORY_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveHistoryRecord(record: HistoryRecord) {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  const db = await openHistoryDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE_NAME, "readwrite");
    const store = transaction.objectStore(HISTORY_STORE_NAME);

    store.put(record);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
}

export function ToolStudio() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<ProcessingMode>("compress");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("auto");
  const [quality, setQuality] = useState(82);
  const [maxWidth, setMaxWidth] = useState("1920");
  const [maxHeight, setMaxHeight] = useState("1920");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setQueue((current) => {
        current.forEach((item) => {
          URL.revokeObjectURL(item.sourceUrl);
          if (item.resultUrl) {
            URL.revokeObjectURL(item.resultUrl);
          }
        });

        return current;
      });
    };
  }, []);

  const stats = useMemo(() => {
    const totalOriginal = queue.reduce((acc, item) => acc + item.file.size, 0);
    const completed = queue.filter((item) => item.status === "done");
    const totalOutput = completed.reduce((acc, item) => acc + (item.resultSize ?? 0), 0);

    return {
      count: queue.length,
      totalOriginal,
      completed: completed.length,
      totalOutput,
    };
  }, [queue]);

  const effectiveFormats = useMemo(() => {
    if (mode === "compress") {
      return FORMAT_OPTIONS.filter((item) => item.value !== "png");
    }

    return FORMAT_OPTIONS.filter((item) => item.value !== "auto");
  }, [mode]);

  const currentFormatOption = useMemo(() => {
    return FORMAT_OPTIONS.find((item) => item.value === outputFormat) ?? FORMAT_OPTIONS[0];
  }, [outputFormat]);

  const addFilesToQueue = (files: FileList | File[]) => {
    const nextItems = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map(fileToQueueItem);

    if (!nextItems.length) {
      return;
    }

    setQueue((current) => [...current, ...nextItems]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    addFilesToQueue(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files?.length) {
      addFilesToQueue(event.dataTransfer.files);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setSelectedPresetId(preset.id);
    setMode(preset.mode);
    setQuality(preset.quality);
    setOutputFormat(preset.format);
    setMaxWidth(String(preset.maxWidth));
    setMaxHeight(String(preset.maxHeight));
  };

  const removeQueueItem = (id: string) => {
    setQueue((current) => {
      const target = current.find((item) => item.id === id);

      if (target) {
        URL.revokeObjectURL(target.sourceUrl);
        if (target.resultUrl) {
          URL.revokeObjectURL(target.resultUrl);
        }
      }

      return current.filter((item) => item.id !== id);
    });
  };

  const clearQueue = () => {
    setQueue((current) => {
      current.forEach((item) => {
        URL.revokeObjectURL(item.sourceUrl);
        if (item.resultUrl) {
          URL.revokeObjectURL(item.resultUrl);
        }
      });

      return [];
    });
  };

  const downloadResult = (item: QueueItem) => {
    if (!item.resultBlob || !item.resultName) {
      return;
    }

    const url = URL.createObjectURL(item.resultBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = item.resultName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const previewResult = (item: QueueItem) => {
    const targetUrl = item.resultUrl ?? item.sourceUrl;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const processQueue = async () => {
    if (!queue.length || isProcessing) {
      return;
    }

    setIsProcessing(true);

    for (const item of queue) {
      if (item.status === "done") {
        continue;
      }

      setQueue((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: "processing",
                error: undefined,
              }
            : entry,
        ),
      );

      try {
        const endpoint = mode === "compress" ? "/api/compress" : "/api/convert";
        const formData = new FormData();

        formData.append("file", item.file);
        formData.append("quality", String(quality));
        formData.append("format", outputFormat);
        formData.append("maxWidth", maxWidth || "");
        formData.append("maxHeight", maxHeight || "");

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Não foi possível processar este arquivo.");
        }

        const blob = await response.blob();
        const dimensions = await readImageDimensions(blob);
        const extension = getExtensionFromFormat(outputFormat, blob.type || item.file.type);
        const resultName = `${getFileBaseName(item.file.name)}-mediaforge.${extension}`;
        const resultUrl = URL.createObjectURL(blob);
        const reduction =
          item.file.size > 0 ? Math.max(0, 1 - blob.size / item.file.size) : 0;

        const historyRecord: HistoryRecord = {
          id: crypto.randomUUID(),
          name: resultName,
          createdAt: new Date().toISOString(),
          outputFormat: extension,
          mode,
          originalSize: item.file.size,
          outputSize: blob.size,
          width: dimensions.width,
          height: dimensions.height,
          outputType: blob.type || item.file.type,
          blob,
        };

        await saveHistoryRecord(historyRecord);

        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "done",
                  resultBlob: blob,
                  resultUrl,
                  resultName,
                  resultType: blob.type || item.file.type,
                  resultSize: blob.size,
                  width: dimensions.width,
                  height: dimensions.height,
                  reduction,
                }
              : entry,
          ),
        );
      } catch (error) {
        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "error",
                  error: error instanceof Error ? error.message : "Erro inesperado ao processar o arquivo.",
                }
              : entry,
          ),
        );
      }
    }

    setIsProcessing(false);
  };

  return (
    <section className="page-section">
      <div className="container">
        <div className="tool-shell-v4">
          <div className="tool-hero-v4">
            <div className="tool-hero-copy-v4">
              <p className="tool-eyebrow-v4">Ferramenta</p>
              <h1>Comprima e converta imagens com um fluxo claro e profissional.</h1>
              <p>
                Envie arquivos, defina o objetivo do processamento e acompanhe os resultados em uma fila visual,
                sem poluição de interface e sem etapas soltas.
              </p>
            </div>

            <div className="tool-status-v4">
              <span className="status-pill-v4 dark">
                <QueueIcon />
                <span>Fluxo em etapas</span>
              </span>
              <span className="status-pill-v4 soft">
                <SparklesIcon />
                <span>Interface limpa</span>
              </span>
              <span className="status-pill-v4 success">
                <BoltIcon />
                <span>Processamento online</span>
              </span>
            </div>
          </div>

          <div className="tool-main-v4">
            <section className="studio-panel-v4">
              <div className="step-card-v4">
                <div className="step-header-v4">
                  <span className="step-number-v4">01</span>
                  <div>
                    <h2>Envio de arquivos</h2>
                    <p>Arraste imagens ou selecione um lote com um botão customizado, sem o input padrão do navegador.</p>
                  </div>
                </div>

                <div
                  className={`dropzone-v4 ${isDragging ? "is-dragging" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/tiff"
                    multiple
                    onChange={handleInputChange}
                    className="hidden-input-v4"
                  />

                  <div className="dropzone-icon-v4">
                    <UploadIcon />
                  </div>

                  <div className="dropzone-copy-v4">
                    <strong>Arraste suas imagens aqui</strong>
                    <span>PNG, JPEG, WebP, AVIF, GIF ou TIFF. Você pode enviar um arquivo ou um lote inteiro.</span>
                  </div>

                  <button
                    type="button"
                    className="gradient-button-v4"
                    onClick={(event) => {
                      event.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Escolher arquivos
                  </button>
                </div>
              </div>

              <div className="step-card-v4">
                <div className="step-header-v4">
                  <span className="step-number-v4">02</span>
                  <div>
                    <h2>Objetivo do processamento</h2>
                    <p>Primeiro escolha o que você quer fazer. Depois ajuste o formato, qualidade e limites dimensionais.</p>
                  </div>
                </div>

                <div className="mode-switch-v4">
                  <button
                    type="button"
                    className={`mode-chip-v4 ${mode === "compress" ? "is-active" : ""}`}
                    onClick={() => {
                      setMode("compress");
                      if (outputFormat === "png") {
                        setOutputFormat("auto");
                      }
                    }}
                  >
                    Compactar
                  </button>

                  <button
                    type="button"
                    className={`mode-chip-v4 ${mode === "convert" ? "is-active" : ""}`}
                    onClick={() => {
                      setMode("convert");
                      if (outputFormat === "auto") {
                        setOutputFormat("webp");
                      }
                    }}
                  >
                    Converter
                  </button>
                </div>

                <div className="mode-helper-v4">
                  {mode === "compress"
                    ? "Compactar reduz peso e tenta preservar o formato quando fizer sentido."
                    : "Converter troca o formato final da imagem e ainda aplica otimização na saída."}
                </div>

                <div className="preset-block-v4">
                  <div className="section-title-v4">
                    <span>Presets rápidos</span>
                    <small>Atalhos para cenários comuns</small>
                  </div>

                  <div className="preset-grid-v4">
                    {PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.id}
                        className={`preset-card-v4 ${selectedPresetId === preset.id ? "is-active" : ""}`}
                        onClick={() => handlePresetSelect(preset.id)}
                      >
                        <strong>{preset.label}</strong>
                        <span>{preset.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="fields-grid-v4">
                  <label className="field-v4">
                    <span>Formato de saída</span>
                    <select
                      value={outputFormat}
                      onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
                    >
                      {effectiveFormats.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} · {option.helper}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field-v4 range-field-v4">
                    <span>Qualidade ({quality}%)</span>
                    <input
                      type="range"
                      min={45}
                      max={100}
                      value={quality}
                      onChange={(event) => setQuality(Number(event.target.value))}
                    />
                  </label>

                  <label className="field-v4">
                    <span>Largura máxima</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Ex.: 1920"
                      value={maxWidth}
                      onChange={(event) => setMaxWidth(event.target.value)}
                    />
                  </label>

                  <label className="field-v4">
                    <span>Altura máxima</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Ex.: 1920"
                      value={maxHeight}
                      onChange={(event) => setMaxHeight(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="step-card-v4 compact">
                <div className="step-header-v4">
                  <span className="step-number-v4">03</span>
                  <div>
                    <h2>Executar e monitorar</h2>
                    <p>Os indicadores ficam logo antes da fila para o fluxo continuar limpo e previsível.</p>
                  </div>
                </div>

                <div className="quick-stats-v4">
                  <div className="quick-stat-v4">
                    <span>Na fila</span>
                    <strong>{stats.count}</strong>
                  </div>
                  <div className="quick-stat-v4">
                    <span>Total original</span>
                    <strong>{formatBytes(stats.totalOriginal)}</strong>
                  </div>
                  <div className="quick-stat-v4">
                    <span>Finalizados</span>
                    <strong>{stats.completed}</strong>
                  </div>
                  <div className="quick-stat-v4">
                    <span>Total de saída</span>
                    <strong>{formatBytes(stats.totalOutput)}</strong>
                  </div>
                </div>

                <div className="action-row-v4">
                  <button
                    type="button"
                    className="gradient-button-v4 large"
                    onClick={processQueue}
                    disabled={!queue.length || isProcessing}
                  >
                    {isProcessing ? "Processando..." : "Processar fila"}
                  </button>

                  <button type="button" className="ghost-button-v4" onClick={clearQueue} disabled={!queue.length}>
                    Limpar fila
                  </button>
                </div>
              </div>
            </section>

            <section className="queue-panel-v4">
              <div className="queue-header-v4">
                <p className="tool-eyebrow-v4">Fila atual</p>
                <h2>Acompanhe o lote em tempo real</h2>
                <p>Preview, status, redução de tamanho, ações rápidas e layout horizontal com leitura mais clara.</p>
              </div>

              {queue.length === 0 ? (
                <div className="queue-empty-v4">
                  <QueueIcon />
                  <strong>Nenhum arquivo na fila.</strong>
                  <span>Adicione imagens acima para ver preview, redução de tamanho e acesso rápido ao download.</span>
                </div>
              ) : (
                <div className="queue-list-v4">
                  {queue.map((item) => (
                    <article className="queue-card-v4" key={item.id}>
                      <div className="queue-preview-v4">
                        <img src={item.resultUrl ?? item.sourceUrl} alt={item.file.name} />
                      </div>

                      <div className="queue-body-v4">
                        <div className="queue-title-row-v4">
                          <div className="queue-title-wrap-v4">
                            <h3 title={item.file.name}>{item.file.name}</h3>
                            <p>{item.file.type || "imagem"}</p>
                          </div>

                          <span className={`queue-status-v4 ${item.status}`}>
                            {item.status === "idle" && "Na fila"}
                            {item.status === "processing" && "Processando"}
                            {item.status === "done" && "Pronto"}
                            {item.status === "error" && "Erro"}
                          </span>
                        </div>

                        <div className="queue-metrics-v4">
                          <span>Original {formatBytes(item.file.size)}</span>
                          <span>
                            Saída {item.resultSize ? formatBytes(item.resultSize) : "—"}
                          </span>
                          <span>
                            Redução{" "}
                            {typeof item.reduction === "number" ? `${Math.round(item.reduction * 100)}%` : "—"}
                          </span>
                          <span>
                            Dimensões {item.width && item.height ? `${item.width}×${item.height}` : "—"}
                          </span>
                        </div>

                        {item.error ? <p className="queue-error-v4">{item.error}</p> : null}

                        <div className="queue-actions-v4">
                          <button
                            type="button"
                            className="action-button-v4 primary"
                            onClick={() => downloadResult(item)}
                            disabled={!item.resultBlob}
                          >
                            <DownloadIcon />
                            <span>Baixar</span>
                          </button>

                          <button
                            type="button"
                            className="action-button-v4 neutral"
                            onClick={() => previewResult(item)}
                          >
                            <EyeIcon />
                            <span>Visualizar</span>
                          </button>

                          <button
                            type="button"
                            className="action-button-v4 danger"
                            onClick={() => removeQueueItem(item.id)}
                          >
                            <TrashIcon />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tool-shell-v4 {
          display: grid;
          gap: 28px;
        }

        .tool-hero-v4 {
          display: grid;
          gap: 18px;
          align-items: end;
        }

        .tool-hero-copy-v4 {
          max-width: 880px;
        }

        .tool-eyebrow-v4 {
          margin: 0 0 12px;
          color: #655bff;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-weight: 800;
          font-size: 0.78rem;
        }

        .tool-hero-copy-v4 h1 {
          margin: 0;
          color: #17233c;
          letter-spacing: -0.045em;
          line-height: 0.96;
        }

        .tool-hero-copy-v4 p {
          margin: 12px 0 0;
          color: #5e697b;
          font-size: 1.02rem;
          line-height: 1.6;
        }

        .tool-status-v4 {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .status-pill-v4 {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 14px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.92rem;
          border: 1px solid transparent;
        }

        .status-pill-v4 :global(svg) {
          width: 18px;
          height: 18px;
        }

        .status-pill-v4.dark {
          background: #172b4d;
          color: #fff;
        }

        .status-pill-v4.soft {
          background: #efe8dd;
          color: #75513a;
          border-color: #ddcdbb;
        }

        .status-pill-v4.success {
          background: #e5f6ea;
          color: #2d7a49;
          border-color: #c6e8d1;
        }

        .tool-main-v4 {
          display: grid;
          gap: 22px;
        }

        .studio-panel-v4,
        .queue-panel-v4 {
          display: grid;
          gap: 18px;
          padding: 22px;
          border-radius: 28px;
          border: 1px solid #ddd5c8;
          background: linear-gradient(180deg, #fffdfa 0%, #faf6ef 100%);
          box-shadow: 0 18px 34px rgba(20, 31, 53, 0.05);
        }

        .step-card-v4 {
          display: grid;
          gap: 18px;
          padding: 20px;
          border-radius: 22px;
          background: #ffffff;
          border: 1px solid #e7dfd2;
        }

        .step-card-v4.compact {
          background: linear-gradient(180deg, #fffdf7 0%, #fbf7ef 100%);
        }

        .step-header-v4 {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }

        .step-number-v4 {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #172b4d;
          color: #fff;
          font-size: 0.92rem;
          font-weight: 800;
          box-shadow: 0 12px 22px rgba(23, 43, 77, 0.16);
        }

        .step-header-v4 h2 {
          margin: 0;
          color: #17233c;
          font-size: clamp(1.15rem, 2vw, 1.4rem);
          letter-spacing: -0.03em;
        }

        .step-header-v4 p {
          margin: 6px 0 0;
          color: #617083;
          line-height: 1.55;
        }

        .dropzone-v4 {
          display: grid;
          justify-items: start;
          gap: 14px;
          padding: 24px;
          border-radius: 24px;
          border: 1px dashed #cdbfa8;
          background:
            radial-gradient(circle at top right, rgba(101, 91, 255, 0.08), transparent 28%),
            linear-gradient(180deg, #fffdf9 0%, #fbf6ed 100%);
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .dropzone-v4:hover,
        .dropzone-v4.is-dragging {
          transform: translateY(-1px);
          border-color: #9f90ff;
          box-shadow: 0 18px 28px rgba(101, 91, 255, 0.09);
        }

        .hidden-input-v4 {
          display: none;
        }

        .dropzone-icon-v4 {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: #172b4d;
          color: #fff;
          box-shadow: 0 14px 24px rgba(23, 43, 77, 0.16);
        }

        .dropzone-icon-v4 :global(svg) {
          width: 24px;
          height: 24px;
        }

        .dropzone-copy-v4 {
          display: grid;
          gap: 6px;
        }

        .dropzone-copy-v4 strong {
          color: #17233c;
          font-size: clamp(1.2rem, 2vw, 1.45rem);
          letter-spacing: -0.03em;
        }

        .dropzone-copy-v4 span {
          color: #617083;
          line-height: 1.55;
          max-width: 62ch;
        }

        .gradient-button-v4,
        .ghost-button-v4,
        .mode-chip-v4,
        .preset-card-v4,
        .action-button-v4 {
          transition:
            transform 0.16s ease,
            box-shadow 0.22s ease,
            background 0.22s ease,
            border-color 0.22s ease,
            color 0.22s ease,
            opacity 0.22s ease;
        }

        .gradient-button-v4:active,
        .ghost-button-v4:active,
        .mode-chip-v4:active,
        .preset-card-v4:active,
        .action-button-v4:active {
          transform: scale(0.98);
        }

        .gradient-button-v4 {
          min-height: 48px;
          border: 0;
          border-radius: 16px;
          padding: 0 18px;
          cursor: pointer;
          font-weight: 800;
          color: #fff;
          background: linear-gradient(135deg, #695bff 0%, #ff735c 100%);
          box-shadow: 0 16px 24px rgba(105, 91, 255, 0.2);
        }

        .gradient-button-v4:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 28px rgba(105, 91, 255, 0.26);
        }

        .gradient-button-v4.large {
          min-height: 54px;
          padding-inline: 24px;
        }

        .gradient-button-v4:disabled,
        .ghost-button-v4:disabled,
        .action-button-v4:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .mode-switch-v4 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          padding: 6px;
          border-radius: 18px;
          background: #f4efe7;
          border: 1px solid #e3dbcf;
        }

        .mode-chip-v4 {
          min-height: 52px;
          border: 0;
          border-radius: 14px;
          background: transparent;
          color: #617083;
          cursor: pointer;
          font-weight: 800;
        }

        .mode-chip-v4.is-active {
          background: #ffffff;
          color: #17233c;
          box-shadow: 0 12px 20px rgba(20, 31, 53, 0.08);
        }

        .mode-helper-v4 {
          padding: 14px 16px;
          border-radius: 18px;
          background: #f9f4eb;
          border: 1px solid #ece0ce;
          color: #70543d;
          line-height: 1.5;
          font-weight: 700;
        }

        .preset-block-v4 {
          display: grid;
          gap: 12px;
        }

        .section-title-v4 {
          display: grid;
          gap: 3px;
        }

        .section-title-v4 span {
          color: #17233c;
          font-weight: 800;
        }

        .section-title-v4 small {
          color: #6c7788;
          font-size: 0.92rem;
        }

        .preset-grid-v4 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .preset-card-v4 {
          text-align: left;
          border: 1px solid #e3dbcf;
          background: #fff;
          border-radius: 18px;
          padding: 14px;
          cursor: pointer;
          display: grid;
          gap: 6px;
        }

        .preset-card-v4:hover {
          transform: translateY(-2px);
          border-color: #ccc0ff;
          box-shadow: 0 14px 22px rgba(101, 91, 255, 0.08);
        }

        .preset-card-v4.is-active {
          background: linear-gradient(180deg, #f5f2ff 0%, #fff 100%);
          border-color: #c9c0ff;
          box-shadow: 0 14px 22px rgba(101, 91, 255, 0.1);
        }

        .preset-card-v4 strong {
          color: #17233c;
          font-size: 0.98rem;
        }

        .preset-card-v4 span {
          color: #6d7787;
          line-height: 1.45;
          font-size: 0.9rem;
        }

        .fields-grid-v4 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .field-v4 {
          display: grid;
          gap: 8px;
        }

        .field-v4 span {
          color: #17233c;
          font-weight: 800;
        }

        .field-v4 select,
        .field-v4 input[type="number"] {
          width: 100%;
          min-height: 52px;
          border-radius: 16px;
          border: 1px solid #dccfb9;
          background: #fff;
          color: #17233c;
          padding: 0 14px;
          outline: none;
          font-size: 0.96rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .field-v4 select:focus,
        .field-v4 input[type="number"]:focus {
          border-color: #8c83ff;
          box-shadow: 0 0 0 4px rgba(101, 91, 255, 0.12);
        }

        .range-field-v4 input[type="range"] {
          width: 100%;
          accent-color: #655bff;
        }

        .quick-stats-v4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .quick-stat-v4 {
          display: grid;
          gap: 6px;
          padding: 16px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid #e7dfd2;
        }

        .quick-stat-v4 span {
          color: #7b8796;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 800;
        }

        .quick-stat-v4 strong {
          color: #17233c;
          font-size: 1.1rem;
        }

        .action-row-v4 {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ghost-button-v4 {
          min-height: 52px;
          border-radius: 16px;
          border: 1px solid #d8cdb9;
          background: #fffaf3;
          color: #4d3928;
          cursor: pointer;
          padding: 0 18px;
          font-weight: 800;
        }

        .ghost-button-v4:hover {
          transform: translateY(-1px);
          background: #fff3e2;
          box-shadow: 0 12px 18px rgba(77, 57, 40, 0.08);
        }

        .queue-header-v4 h2 {
          margin: 0;
          color: #17233c;
          letter-spacing: -0.03em;
        }

        .queue-header-v4 p:last-child {
          margin: 10px 0 0;
          color: #607084;
          line-height: 1.6;
        }

        .queue-empty-v4 {
          display: grid;
          justify-items: center;
          gap: 10px;
          padding: 34px 24px;
          border-radius: 24px;
          border: 1px dashed #d8cdb9;
          background: #fffdf8;
          text-align: center;
        }

        .queue-empty-v4 :global(svg) {
          width: 28px;
          height: 28px;
          color: #655bff;
        }

        .queue-empty-v4 strong {
          color: #17233c;
          font-size: 1.08rem;
        }

        .queue-empty-v4 span {
          color: #697486;
          line-height: 1.6;
          max-width: 54ch;
        }

        .queue-list-v4 {
          display: grid;
          gap: 14px;
        }

        .queue-card-v4 {
          display: grid;
          grid-template-columns: 180px minmax(0, 1fr);
          gap: 16px;
          padding: 16px;
          border-radius: 24px;
          background: #fff;
          border: 1px solid #e7dfd2;
          box-shadow: 0 14px 24px rgba(20, 31, 53, 0.05);
        }

        .queue-preview-v4 {
          aspect-ratio: 4 / 3;
          overflow: hidden;
          border-radius: 18px;
          background: linear-gradient(135deg, #f5efe7 0%, #ece3d6 100%);
        }

        .queue-preview-v4 img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .queue-body-v4 {
          display: grid;
          gap: 12px;
          align-content: start;
        }

        .queue-title-row-v4 {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 14px;
        }

        .queue-title-wrap-v4 h3 {
          margin: 0;
          color: #17233c;
          font-size: 1.15rem;
          line-height: 1.08;
          letter-spacing: -0.03em;
          word-break: break-word;
        }

        .queue-title-wrap-v4 p {
          margin: 6px 0 0;
          color: #748093;
          font-size: 0.92rem;
        }

        .queue-status-v4 {
          flex: 0 0 auto;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .queue-status-v4.idle {
          background: #efe8dd;
          color: #71533a;
        }

        .queue-status-v4.processing {
          background: #edf1ff;
          color: #4256cc;
        }

        .queue-status-v4.done {
          background: #e7f6ec;
          color: #2b7a48;
        }

        .queue-status-v4.error {
          background: #fff0f0;
          color: #aa3d48;
        }

        .queue-metrics-v4 {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .queue-metrics-v4 span {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          background: #f6f1e8;
          border: 1px solid #e8decf;
          color: #606c7c;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .queue-error-v4 {
          margin: 0;
          color: #b23a49;
          font-weight: 700;
          line-height: 1.5;
        }

        .queue-actions-v4 {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .action-button-v4 {
          min-height: 46px;
          border-radius: 16px;
          border: 1px solid transparent;
          background: #fff;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .action-button-v4 :global(svg) {
          width: 18px;
          height: 18px;
        }

        .action-button-v4:hover {
          transform: translateY(-2px);
        }

        .action-button-v4.primary {
          background: #172b4d;
          color: #fff;
          box-shadow: 0 12px 20px rgba(23, 43, 77, 0.16);
        }

        .action-button-v4.primary:hover {
          box-shadow: 0 16px 24px rgba(23, 43, 77, 0.22);
        }

        .action-button-v4.neutral {
          border-color: #ddd2be;
          color: #17233c;
        }

        .action-button-v4.neutral:hover {
          background: #faf6ef;
        }

        .action-button-v4.danger {
          border-color: #efc9cf;
          background: #fff2f2;
          color: #a73b49;
        }

        .action-button-v4.danger:hover {
          background: #ffe7ea;
        }

        @media (min-width: 980px) {
          .tool-hero-v4 {
            grid-template-columns: minmax(0, 1.1fr) auto;
          }
        }

        @media (max-width: 979px) {
          .tool-hero-copy-v4 h1 {
            font-size: clamp(2.4rem, 8vw, 4rem);
          }
        }

        @media (max-width: 860px) {
          .preset-grid-v4,
          .fields-grid-v4,
          .quick-stats-v4 {
            grid-template-columns: 1fr;
          }

          .queue-card-v4 {
            grid-template-columns: 1fr;
          }

          .queue-preview-v4 {
            aspect-ratio: 16 / 10;
          }
        }

        @media (max-width: 640px) {
          .studio-panel-v4,
          .queue-panel-v4 {
            padding: 16px;
            border-radius: 22px;
          }

          .step-card-v4 {
            padding: 16px;
          }

          .dropzone-v4 {
            padding: 18px;
          }

          .dropzone-copy-v4 strong {
            font-size: 1.1rem;
          }

          .tool-status-v4,
          .queue-actions-v4,
          .action-row-v4 {
            display: grid;
            grid-template-columns: 1fr;
          }

          .status-pill-v4,
          .gradient-button-v4,
          .ghost-button-v4,
          .action-button-v4 {
            width: 100%;
          }

          .mode-switch-v4 {
            grid-template-columns: 1fr;
          }

          .queue-title-row-v4 {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  );
}