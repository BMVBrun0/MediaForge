"use client";

import { useEffect, useMemo, useState } from "react";
import { formatBytes, formatDate, formatReduction } from "@/src/lib/utils/formatters";
import type { PersistedHistoryRecord } from "@/src/lib/types";

interface HistoryPanelProps {
  history: PersistedHistoryRecord[];
  isHydrating: boolean;
  onDelete: (id: string) => void;
  onClearAll: () => void;
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

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 5h5v5m-1-4-8.5 8.5M14 7H9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5"
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m21 21-4.35-4.35M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm3 9 2.8-2.8a1.2 1.2 0 0 1 1.7 0L14 14.7l1.8-1.8a1.2 1.2 0 0 1 1.7 0L20 15.4M9 9.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HistoryPanel({ history, isHydrating, onDelete, onClearAll }: HistoryPanelProps) {
  const [query, setQuery] = useState("");
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return [...history]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((item) => {
        if (!term) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(term) ||
          item.outputFormat.toLowerCase().includes(term) ||
          item.mode.toLowerCase().includes(term)
        );
      });
  }, [history, query]);

  useEffect(() => {
    const urls: Record<string, string> = {};

    for (const record of filtered) {
      if (record.outputType.startsWith("image/")) {
        urls[record.id] = URL.createObjectURL(record.blob);
      }
    }

    setPreviewUrls(urls);

    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filtered]);

  const handleDownload = (record: PersistedHistoryRecord) => {
    const url = URL.createObjectURL(record.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = record.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleOpen = (record: PersistedHistoryRecord) => {
    const previewUrl = previewUrls[record.id];

    if (previewUrl) {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const url = URL.createObjectURL(record.blob);
    window.open(url, "_blank", "noopener,noreferrer");

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 30_000);
  };

  return (
    <section className="page-section">
      <div className="container">
        <div className="history-shell-v2">
          <div className="history-topbar-v2">
            <div className="history-copy-v2">
              <p className="history-eyebrow-v2">Histórico</p>
              <h1>Resultados prontos para baixar novamente.</h1>
              <p>
                Visualize miniaturas, compare tamanhos e reaproveite arquivos já processados sem precisar repetir o fluxo.
              </p>
            </div>

            <div className="history-tools-v2">
              <label className="search-box-v2">
                <span className="search-icon-v2">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por nome, modo ou formato"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <button type="button" className="clear-history-btn-v2" onClick={onClearAll}>
                Limpar histórico
              </button>
            </div>
          </div>

          {!isHydrating && filtered.length > 0 ? (
            <div className="history-counter-v2">
              <strong>{filtered.length}</strong>
              <span>{filtered.length === 1 ? "item encontrado" : "itens encontrados"}</span>
            </div>
          ) : null}

          {isHydrating ? (
            <div className="history-empty-v2">
              <strong>Carregando histórico...</strong>
              <span>Preparando seus arquivos salvos localmente.</span>
            </div>
          ) : null}

          {!isHydrating && filtered.length === 0 ? (
            <div className="history-empty-v2">
              <strong>Nenhum resultado salvo ainda.</strong>
              <span>Depois de processar imagens, elas aparecerão aqui com preview e ações rápidas.</span>
            </div>
          ) : null}

          {!isHydrating && filtered.length > 0 ? (
            <div className="history-grid-v2">
              {filtered.map((record) => {
                const previewUrl = previewUrls[record.id];
                const reduction = formatReduction(record.originalSize, record.outputSize);
                const modeLabel = record.mode === "compress" ? "Compactado" : "Convertido";

                return (
                  <article className="history-card-v2" key={record.id}>
                    <div className="history-preview-v2">
                      {previewUrl ? (
                        <img src={previewUrl} alt={record.name} />
                      ) : (
                        <div className="history-preview-fallback-v2">
                          <ImageIcon />
                          <span>Sem preview</span>
                        </div>
                      )}

                      <div className="history-badges-v2">
                        <span className="history-badge-v2 format">{record.outputFormat.toUpperCase()}</span>
                        <span className="history-badge-v2 mode">{modeLabel}</span>
                      </div>
                    </div>

                    <div className="history-content-v2">
                      <div className="history-title-wrap-v2">
                        <h2 title={record.name}>{record.name}</h2>
                        <p>{formatDate(record.createdAt)}</p>
                      </div>

                      <div className="history-stats-v2">
                        <div className="history-stat-v2">
                          <span>Original</span>
                          <strong>{formatBytes(record.originalSize)}</strong>
                        </div>

                        <div className="history-stat-v2 emphasis">
                          <span>Saída</span>
                          <strong>{formatBytes(record.outputSize)}</strong>
                        </div>

                        <div className="history-stat-v2">
                          <span>Redução</span>
                          <strong>{reduction}</strong>
                        </div>

                        <div className="history-stat-v2">
                          <span>Dimensões</span>
                          <strong>{record.width && record.height ? `${record.width}×${record.height}` : "—"}</strong>
                        </div>
                      </div>

                      <div className="history-meta-strip-v2">
                        <span>{record.outputType}</span>
                        <span>{modeLabel}</span>
                      </div>

                      <div className="history-actions-v2">
                        <button type="button" className="action-btn-v2 primary" onClick={() => handleDownload(record)}>
                          <DownloadIcon />
                          <span>Baixar</span>
                        </button>

                        <button type="button" className="action-btn-v2 neutral" onClick={() => handleOpen(record)}>
                          <ExternalIcon />
                          <span>Visualizar</span>
                        </button>

                        <button type="button" className="action-btn-v2 danger" onClick={() => onDelete(record.id)}>
                          <TrashIcon />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .history-shell-v2 {
          display: grid;
          gap: 24px;
        }

        .history-topbar-v2 {
          display: grid;
          gap: 18px;
          align-items: end;
        }

        .history-copy-v2 {
          max-width: 780px;
        }

        .history-copy-v2 h1 {
          margin: 0;
          color: #17233c;
          line-height: 0.96;
          letter-spacing: -0.04em;
        }

        .history-copy-v2 p {
          margin: 12px 0 0;
          color: #5d697d;
          font-size: 1.02rem;
          line-height: 1.6;
        }

        .history-eyebrow-v2 {
          margin: 0 0 12px;
          color: #635bff;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-weight: 800;
          font-size: 0.78rem;
        }

        .history-tools-v2 {
          display: grid;
          gap: 12px;
        }

        .search-box-v2 {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon-v2 {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #6f7788;
          pointer-events: none;
        }

        .search-icon-v2 :global(svg) {
          width: 100%;
          height: 100%;
          display: block;
        }

        .search-box-v2 input {
          width: 100%;
          min-height: 56px;
          border-radius: 18px;
          border: 1px solid #d6d8df;
          background: #ffffff;
          color: #16233a;
          padding: 0 18px 0 44px;
          font-size: 0.98rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        .search-box-v2 input:focus {
          border-color: #8c83ff;
          box-shadow: 0 0 0 4px rgba(99, 91, 255, 0.12);
        }

        .clear-history-btn-v2 {
          min-height: 52px;
          border-radius: 16px;
          border: 1px solid #d4c9b6;
          background: #fffaf2;
          color: #50371f;
          font-weight: 800;
          padding: 0 18px;
          cursor: pointer;
          transition: transform 0.16s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .clear-history-btn-v2:hover {
          transform: translateY(-1px);
          background: #fff4e6;
          box-shadow: 0 10px 22px rgba(80, 55, 31, 0.08);
        }

        .clear-history-btn-v2:active {
          transform: scale(0.98);
        }

        .history-counter-v2 {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: fit-content;
          min-height: 42px;
          padding: 0 14px;
          border-radius: 999px;
          background: #f3efe8;
          color: #576273;
          border: 1px solid #e6dfd3;
        }

        .history-counter-v2 strong {
          color: #16233a;
        }

        .history-empty-v2 {
          display: grid;
          gap: 6px;
          padding: 28px;
          border-radius: 24px;
          border: 1px dashed #d6d8df;
          background: #fffdf8;
          color: #5b6678;
        }

        .history-empty-v2 strong {
          color: #18243d;
          font-size: 1.1rem;
        }

        .history-grid-v2 {
          display: grid;
          gap: 18px;
        }

        .history-card-v2 {
          display: grid;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid #ddd7cb;
          background:
            radial-gradient(circle at top right, rgba(110, 100, 255, 0.08), transparent 28%),
            linear-gradient(180deg, #ffffff 0%, #fcfaf6 100%);
          box-shadow: 0 18px 40px rgba(13, 26, 50, 0.07);
          transition: transform 0.2s ease, box-shadow 0.25s ease, border-color 0.2s ease;
        }

        .history-card-v2:hover {
          transform: translateY(-3px);
          border-color: #cfc7ba;
          box-shadow: 0 22px 46px rgba(13, 26, 50, 0.1);
        }

        .history-preview-v2 {
          position: relative;
          aspect-ratio: 16 / 10;
          background:
            linear-gradient(135deg, #f5efe7 0%, #efe6d8 100%);
          border-bottom: 1px solid #e8dfd1;
          overflow: hidden;
        }

        .history-preview-v2 img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .history-preview-fallback-v2 {
          height: 100%;
          display: grid;
          place-items: center;
          gap: 10px;
          align-content: center;
          color: #6c7787;
          background:
            linear-gradient(135deg, rgba(99, 91, 255, 0.08), rgba(37, 99, 235, 0.06));
        }

        .history-preview-fallback-v2 :global(svg) {
          width: 34px;
          height: 34px;
        }

        .history-badges-v2 {
          position: absolute;
          top: 14px;
          left: 14px;
          right: 14px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          pointer-events: none;
        }

        .history-badge-v2 {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
        }

        .history-badge-v2.format {
          background: rgba(255, 255, 255, 0.88);
          color: #1d2b46;
        }

        .history-badge-v2.mode {
          background: rgba(23, 35, 60, 0.88);
          color: #f8f9fb;
        }

        .history-content-v2 {
          display: grid;
          gap: 16px;
          padding: 18px;
        }

        .history-title-wrap-v2 h2 {
          margin: 0;
          color: #16233a;
          font-size: clamp(1.15rem, 2vw, 1.55rem);
          line-height: 1.02;
          letter-spacing: -0.035em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .history-title-wrap-v2 p {
          margin: 8px 0 0;
          color: #6b7586;
          font-size: 0.94rem;
        }

        .history-stats-v2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .history-stat-v2 {
          display: grid;
          gap: 5px;
          padding: 14px;
          border-radius: 18px;
          background: #f6f3ed;
          border: 1px solid #ebe3d7;
        }

        .history-stat-v2 span {
          color: #7b8696;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .history-stat-v2 strong {
          color: #17233c;
          font-size: 1rem;
          line-height: 1.15;
        }

        .history-stat-v2.emphasis {
          background: linear-gradient(135deg, #eef2ff 0%, #f3edff 100%);
          border-color: #dcd4ff;
        }

        .history-meta-strip-v2 {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .history-meta-strip-v2 span {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background: #f4efe6;
          border: 1px solid #e5ddcf;
          color: #5f6b7d;
          font-weight: 700;
          font-size: 0.84rem;
        }

        .history-actions-v2 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .action-btn-v2 {
          min-height: 48px;
          border-radius: 16px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 14px;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            box-shadow 0.22s ease,
            background 0.22s ease,
            border-color 0.22s ease,
            color 0.22s ease;
        }

        .action-btn-v2 :global(svg) {
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
        }

        .action-btn-v2:hover {
          transform: translateY(-2px);
        }

        .action-btn-v2:active {
          transform: scale(0.98);
        }

        .action-btn-v2.primary {
          background: #172b4d;
          color: #ffffff;
          box-shadow: 0 14px 22px rgba(23, 43, 77, 0.16);
        }

        .action-btn-v2.primary:hover {
          background: #102441;
          box-shadow: 0 16px 26px rgba(23, 43, 77, 0.22);
        }

        .action-btn-v2.neutral {
          background: #ffffff;
          color: #17233c;
          border-color: #dcd6ca;
        }

        .action-btn-v2.neutral:hover {
          background: #faf8f3;
          border-color: #cfc7bb;
        }

        .action-btn-v2.danger {
          background: #fff1f1;
          color: #a13b4a;
          border-color: #f0c7cd;
        }

        .action-btn-v2.danger:hover {
          background: #ffe6e9;
          border-color: #e7a8b2;
        }

        @media (min-width: 860px) {
          .history-topbar-v2 {
            grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
          }

          .history-grid-v2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1220px) {
          .history-grid-v2 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 859px) {
          .history-copy-v2 h1 {
            font-size: clamp(2.2rem, 9vw, 3.3rem);
          }
        }

        @media (max-width: 640px) {
          .history-shell-v2 {
            gap: 18px;
          }

          .history-copy-v2 h1 {
            font-size: clamp(1.9rem, 11vw, 2.7rem);
          }

          .history-copy-v2 p {
            font-size: 0.96rem;
          }

          .history-counter-v2 {
            width: 100%;
            justify-content: center;
          }

          .history-content-v2 {
            padding: 14px;
          }

          .history-stats-v2 {
            grid-template-columns: 1fr;
          }

          .history-actions-v2 {
            grid-template-columns: 1fr;
          }

          .action-btn-v2 {
            width: 100%;
          }

          .clear-history-btn-v2 {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}