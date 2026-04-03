"use client";

import { useMemo, useState } from "react";
import { formatBytes, formatDate, formatReduction } from "@/src/lib/utils/formatters";
import type { PersistedHistoryRecord } from "@/src/lib/types";

interface HistoryPanelProps {
  history: PersistedHistoryRecord[];
  isHydrating: boolean;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryPanel({ history, isHydrating, onDelete, onClearAll }: HistoryPanelProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return history;
    }

    return history.filter((item) => item.name.toLowerCase().includes(term) || item.outputFormat.toLowerCase().includes(term));
  }, [history, query]);

  const handleDownload = (record: PersistedHistoryRecord) => {
    const url = URL.createObjectURL(record.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = record.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page-section">
      <div className="container page-stack">
        <div className="page-heading page-heading-row">
          <div>
            <p className="eyebrow">Histórico</p>
            <h1>Resultados armazenados localmente no navegador.</h1>
            <p className="lead">Use a busca para localizar saídas recentes e baixar de novo sem processar tudo outra vez.</p>
          </div>

          <div className="toolbar-inline">
            <input
              className="field-control search-field"
              placeholder="Buscar arquivo ou formato"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="button" className="button-ghost compact" onClick={onClearAll}>
              Limpar histórico
            </button>
          </div>
        </div>

        {isHydrating ? <div className="empty-state">Carregando histórico salvo...</div> : null}

        {!isHydrating && filtered.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum resultado salvo ainda.</strong>
            <span>Quando você processar imagens, o histórico local aparecerá aqui.</span>
          </div>
        ) : null}

        {!isHydrating && filtered.length > 0 ? (
          <div className="history-grid">
            {filtered.map((record) => (
              <article className="history-card" key={record.id}>
                <div className="history-card-top">
                  <div>
                    <h2>{record.name}</h2>
                    <p>{formatDate(record.createdAt)}</p>
                  </div>
                  <span className="result-tag success">{record.outputFormat.toUpperCase()}</span>
                </div>

                <div className="meta-pills history-meta">
                  <span>Original {formatBytes(record.originalSize)}</span>
                  <span>Saída {formatBytes(record.outputSize)}</span>
                  <span>Redução {formatReduction(record.originalSize, record.outputSize)}</span>
                  {record.width && record.height ? <span>{record.width}×{record.height}</span> : null}
                </div>

                <div className="card-actions wrap-actions">
                  <button type="button" className="button-secondary compact" onClick={() => handleDownload(record)}>
                    Baixar
                  </button>
                  <button type="button" className="button-ghost compact" onClick={() => onDelete(record.id)}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
