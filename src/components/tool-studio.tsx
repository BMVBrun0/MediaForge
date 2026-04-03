"use client";

import { useMemo, useState } from "react";
import { OptionsPanel } from "./options-panel";
import { QueueList } from "./queue-list";
import { UploadDropzone } from "./upload-dropzone";
import type { OutputFormat, PersistedHistoryRecord, ProcessOptions, QueueItem } from "@/src/lib/types";
import { useHistory } from "@/src/lib/hooks/use-history";
import { useOnlineStatus } from "@/src/lib/hooks/use-online-status";
import { buildOutputFileName } from "@/src/lib/utils/file";
import { formatBytes } from "@/src/lib/utils/formatters";

const DEFAULT_OPTIONS: ProcessOptions = {
  mode: "compress",
  outputFormat: "webp",
  quality: 82,
};

function getOutputFormatFromHeaders(headers: Headers, fallback: OutputFormat): OutputFormat {
  const headerValue = headers.get("X-Output-Format");

  if (headerValue === "jpeg" || headerValue === "png" || headerValue === "webp" || headerValue === "avif") {
    return headerValue;
  }

  return fallback;
}

export function ToolStudio() {
  const [options, setOptions] = useState<ProcessOptions>(DEFAULT_OPTIONS);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const { addRecord } = useHistory();

  const queueStats = useMemo(() => {
    const source = queue.reduce((sum, item) => sum + item.sourceSize, 0);
    const output = queue.reduce((sum, item) => sum + (item.outputSize ?? 0), 0);
    const finished = queue.filter((item) => item.status === "done").length;

    return {
      source,
      output,
      finished,
    };
  }, [queue]);

  const showBanner = (message: string) => {
    setBanner(message);
    window.setTimeout(() => setBanner(null), 2600);
  };

  const addFilesToQueue = (files: File[]) => {
    const nextItems = files.map<QueueItem>((file) => ({
      id: `${file.name}-${crypto.randomUUID()}`,
      file,
      sourceUrl: URL.createObjectURL(file),
      status: "queued",
      sourceName: file.name,
      sourceSize: file.size,
      sourceType: file.type,
    }));

    setQueue((current) => [...nextItems, ...current]);
    showBanner(`${files.length} arquivo${files.length > 1 ? "s" : ""} adicionado${files.length > 1 ? "s" : ""} à fila.`);
  };

  const removeItem = (id: string) => {
    setQueue((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.sourceUrl) {
        URL.revokeObjectURL(target.sourceUrl);
      }
      if (target?.outputUrl) {
        URL.revokeObjectURL(target.outputUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const clearQueue = () => {
    queue.forEach((item) => {
      URL.revokeObjectURL(item.sourceUrl);
      if (item.outputUrl) {
        URL.revokeObjectURL(item.outputUrl);
      }
    });
    setQueue([]);
  };

  const processQueue = async () => {
    if (queue.length === 0 || isProcessing || !isOnline) {
      return;
    }

    setIsProcessing(true);
    setBanner(null);

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
                message: "Processando imagem no servidor...",
              }
            : entry,
        ),
      );

      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("mode", options.mode);
        formData.append("outputFormat", options.outputFormat);
        formData.append("quality", String(options.quality));

        if (options.maxWidth) {
          formData.append("maxWidth", String(options.maxWidth));
        }

        if (options.maxHeight) {
          formData.append("maxHeight", String(options.maxHeight));
        }

        const response = await fetch("/api/image/process", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Falha no processamento." }));
          throw new Error(payload.error ?? "Falha no processamento.");
        }

        const outputBlob = await response.blob();
        const outputUrl = URL.createObjectURL(outputBlob);
        const responseFormat = getOutputFormatFromHeaders(response.headers, options.outputFormat);
        const outputName = buildOutputFileName(item.sourceName, responseFormat);
        const outputSize = Number(response.headers.get("X-Output-Size") ?? outputBlob.size);
        const width = Number(response.headers.get("X-Output-Width") ?? 0) || undefined;
        const height = Number(response.headers.get("X-Output-Height") ?? 0) || undefined;
        const mimeType = response.headers.get("Content-Type") ?? outputBlob.type;

        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "done",
                  outputUrl,
                  outputName,
                  outputSize,
                  outputType: mimeType,
                  width,
                  height,
                  message: `Economia de ${formatBytes(entry.sourceSize - outputSize)} em relação ao arquivo original.`,
                }
              : entry,
          ),
        );

        const historyRecord: PersistedHistoryRecord = {
          id: crypto.randomUUID(),
          name: outputName,
          createdAt: new Date().toISOString(),
          mode: options.mode,
          outputFormat: responseFormat,
          quality: options.quality,
          originalSize: item.sourceSize,
          outputSize,
          outputType: mimeType,
          width,
          height,
          blob: outputBlob,
        };

        await addRecord(historyRecord);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro inesperado no processamento.";

        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "error",
                  message,
                }
              : entry,
          ),
        );
      }
    }

    setIsProcessing(false);
    showBanner("Fila finalizada.");
  };

  return (
    <section className="page-section">
      <div className="container page-stack">
        <div className="page-heading page-heading-row compact-gap">
          <div>
            <p className="eyebrow">Ferramenta</p>
            <h1>Comprima e converta imagens sem complicar o fluxo.</h1>
            <p className="lead">Envie arquivos, ajuste a saída e acompanhe os resultados em uma fila clara para desktop e mobile.</p>
          </div>

          <div className="badge-row">
            <span className="pill pill-dark">Fila em lote</span>
            <span className="pill pill-accent">Histórico local</span>
            <span className={`pill ${isOnline ? "pill-success" : "pill-warning"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {banner ? <div className="inline-banner">{banner}</div> : null}

        <div className="tool-layout">
          <section className="tool-panel tool-panel-left">
            <UploadDropzone onFilesSelected={addFilesToQueue} />
            <OptionsPanel options={options} onChange={setOptions} />

            <div className="stats-grid">
              <div className="stat-card">
                <span>Na fila</span>
                <strong>{queue.length}</strong>
              </div>
              <div className="stat-card">
                <span>Total original</span>
                <strong>{formatBytes(queueStats.source)}</strong>
              </div>
              <div className="stat-card">
                <span>Finalizados</span>
                <strong>{queueStats.finished}</strong>
              </div>
              <div className="stat-card">
                <span>Total de saída</span>
                <strong>{formatBytes(queueStats.output)}</strong>
              </div>
            </div>

            <div className="action-row wrap-actions">
              <button type="button" className="button-primary" onClick={processQueue} disabled={isProcessing || !isOnline}>
                {isProcessing ? "Processando..." : "Processar fila"}
              </button>
              <button type="button" className="button-ghost" onClick={clearQueue}>
                Limpar fila
              </button>
            </div>
          </section>

          <section className="tool-panel tool-panel-right">
            <div className="section-row">
              <div>
                <p className="eyebrow">Fila atual</p>
                <h2>Acompanhe o lote em tempo real</h2>
              </div>
            </div>

            <QueueList items={queue} onRemove={removeItem} />
          </section>
        </div>
      </div>
    </section>
  );
}
