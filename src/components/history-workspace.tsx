"use client";

import { Download, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { clearArtifacts, deleteArtifact, listArtifacts } from "@/src/lib/history";
import { downloadBlob } from "@/src/lib/download";
import { formatBytes, formatDate } from "@/src/lib/format";
import { getTool } from "@/src/lib/tools";
import type { ArtifactRecord } from "@/src/lib/types";

export function HistoryWorkspace() {
  const [records, setRecords] = useState<ArtifactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const refresh = async () => {
    setLoading(true);
    try { setRecords(await listArtifacts()); } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return records.filter((record) => !term || `${record.title} ${record.summary} ${getTool(record.toolId).name}`.toLowerCase().includes(term));
  }, [records, query]);

  return (
    <section className="history-page">
      <div className="history-heading">
        <div><span className="eyebrow">Histórico local</span><h1>Resultados recentes</h1><p>Metadados e arquivos pequenos ficam no IndexedDB deste navegador. Itens grandes registram apenas o resultado da operação.</p></div>
        <div className="history-actions"><label className="search-field"><Search size={17}/><input placeholder="Buscar no histórico" value={query} onChange={(e) => setQuery(e.target.value)}/></label><button className="secondary-button danger-text" onClick={async () => { await clearArtifacts(); await refresh(); }}><Trash2 size={16}/> Limpar tudo</button></div>
      </div>
      {loading ? <div className="history-empty">Carregando histórico…</div> : filtered.length === 0 ? <div className="history-empty"><strong>Nenhum resultado salvo.</strong><span>As operações concluídas começam a aparecer aqui.</span></div> : <div className="history-grid">{filtered.map((record) => <article key={record.id} className="history-card"><div className="history-card-top"><span>{getTool(record.toolId).shortName}</span><small>{formatDate(record.createdAt)}</small></div><h2>{record.title}</h2><p>{record.summary}</p><div className="history-card-meta">{record.outputSize ? <span>{formatBytes(record.outputSize)}</span> : null}{record.outputType ? <span>{record.outputType}</span> : null}</div><div className="history-card-actions">{record.blob && record.outputName ? <button onClick={() => downloadBlob(record.blob!, record.outputName!)}><Download size={15}/> Baixar</button> : <span className="muted-copy">Arquivo não persistido</span>}<button className="icon-button" onClick={async () => { await deleteArtifact(record.id); await refresh(); }} aria-label="Remover do histórico"><Trash2 size={16}/></button></div></article>)}</div>}
    </section>
  );
}
