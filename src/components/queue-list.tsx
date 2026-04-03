"use client";

import { formatBytes, formatReduction } from "@/src/lib/utils/formatters";
import type { QueueItem } from "@/src/lib/types";

interface QueueListProps {
  items: QueueItem[];
  onRemove: (id: string) => void;
}

function getStatusLabel(status: QueueItem["status"]) {
  switch (status) {
    case "done":
      return <span className="result-tag success">Pronto</span>;
    case "processing":
      return <span className="result-tag progress">Processando</span>;
    case "error":
      return <span className="result-tag danger">Erro</span>;
    default:
      return <span className="result-tag neutral">Na fila</span>;
  }
}

export function QueueList({ items, onRemove }: QueueListProps) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <strong>Nenhum arquivo na fila.</strong>
        <span>Adicione imagens para ver prévia, redução de tamanho e acesso rápido ao download.</span>
      </div>
    );
  }

  return (
    <div className="queue-list">
      {items.map((item) => {
        const hasOutput = item.status === "done" && item.outputSize && item.outputUrl;

        return (
          <article className="queue-item-card" key={item.id}>
            <div className="queue-item-top">
              <div>
                <h3>{item.outputName ?? item.sourceName}</h3>
                <p>{item.sourceType || "imagem"}</p>
              </div>
              {getStatusLabel(item.status)}
            </div>

            <div className="queue-item-body">
              <div className="thumb-frame">
                <img src={item.sourceUrl} alt={item.sourceName} />
              </div>

              <div className="queue-item-meta">
                <div className="meta-pills">
                  <span>Original {formatBytes(item.sourceSize)}</span>
                  {item.outputSize ? <span>Saída {formatBytes(item.outputSize)}</span> : null}
                  {item.outputSize ? <span>Redução {formatReduction(item.sourceSize, item.outputSize)}</span> : null}
                  {item.width && item.height ? <span>{item.width}×{item.height}</span> : null}
                </div>

                <p className="queue-message">{item.message ?? "Aguardando processamento."}</p>

                <div className="card-actions wrap-actions">
                  {hasOutput ? (
                    <a href={item.outputUrl} download={item.outputName} className="button-secondary compact-link">
                      Baixar resultado
                    </a>
                  ) : null}

                  <button type="button" className="button-ghost compact" onClick={() => onRemove(item.id)}>
                    Remover
                  </button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
