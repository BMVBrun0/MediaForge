"use client";

import { CheckCircle2, Copy, Fingerprint, XCircle } from "lucide-react";
import { useState } from "react";
import { FileDrop } from "@/src/components/file-drop";
import { hashFile } from "@/src/lib/crypto";
import { copyText } from "@/src/lib/download";
import { formatBytes } from "@/src/lib/format";
import { saveArtifact } from "@/src/lib/history";

export function ChecksumTool() {
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<"SHA-256" | "SHA-512">("SHA-256");
  const [hash, setHash] = useState("");
  const [expected, setExpected] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const value = await hashFile(file, algorithm);
      setHash(value);
      await saveArtifact({ toolId: "checksum", title: `${algorithm} — ${file.name}`, summary: value });
    } finally { setBusy(false); }
  };

  const normalizedExpected = expected.replace(/\s/g, "").toLowerCase();
  const matches = hash && normalizedExpected ? hash.toLowerCase() === normalizedExpected : null;

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <FileDrop onFiles={(files) => { setFile(files[0] ?? null); setHash(""); }} label="Selecione qualquer arquivo" />
        {file ? <div className="selected-file"><Fingerprint size={18}/><span><strong>{file.name}</strong><small>{formatBytes(file.size)}</small></span></div> : null}
        <label><span>Algoritmo</span><select value={algorithm} onChange={(e) => setAlgorithm(e.target.value as "SHA-256" | "SHA-512")}><option>SHA-256</option><option>SHA-512</option></select></label>
        <button className="primary-button full" disabled={!file || busy} onClick={run}>{busy ? "Calculando…" : "Calcular hash"}</button>
      </section>
      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Integridade</span><h2>Hash do arquivo</h2></div>{hash ? <button className="secondary-button" onClick={() => copyText(hash)}><Copy size={16}/> Copiar</button> : null}</div>
        <div className="hash-output">{hash || "O hash calculado aparece aqui."}</div>
        <label><span>Hash esperado</span><textarea rows={4} value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Cole um SHA-256 ou SHA-512 para validar…"/></label>
        {matches === true ? <div className="result-banner success"><CheckCircle2 size={20}/><div><strong>Arquivo íntegro</strong><span>O hash corresponde exatamente ao valor esperado.</span></div></div> : null}
        {matches === false ? <div className="result-banner danger"><XCircle size={20}/><div><strong>Hash diferente</strong><span>O arquivo ou o valor esperado não correspondem.</span></div></div> : null}
      </section>
    </div>
  );
}
