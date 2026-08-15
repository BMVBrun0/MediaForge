"use client";

import { Download, LockKeyhole, ShieldCheck, UnlockKeyhole } from "lucide-react";
import { useState } from "react";
import { FileDrop } from "@/src/components/file-drop";
import { decryptFile, encryptFile } from "@/src/lib/crypto";
import { downloadBlob } from "@/src/lib/download";
import { formatBytes } from "@/src/lib/format";
import { saveArtifact } from "@/src/lib/history";

export function FileCrypto() {
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const run = async () => {
    if (!file) return;
    setError(""); setBusy(true); setResult(null);
    try {
      if (mode === "encrypt") {
        if (password !== confirm) throw new Error("As senhas não coincidem.");
        const blob = await encryptFile(file, password);
        const name = `${file.name}.mediaforge`;
        setResult({ blob, name });
        await saveArtifact({ toolId: "file-crypto", title: `Arquivo criptografado — ${file.name}`, summary: `${formatBytes(file.size)} · AES-GCM`, outputName: name, outputType: blob.type, outputSize: blob.size, blob });
      } else {
        const decrypted = await decryptFile(file, password);
        setResult({ blob: decrypted.blob, name: decrypted.name });
        await saveArtifact({ toolId: "file-crypto", title: `Arquivo descriptografado — ${decrypted.name}`, summary: `${formatBytes(decrypted.blob.size)} recuperados`, outputName: decrypted.name, outputType: decrypted.type, outputSize: decrypted.blob.size, blob: decrypted.blob });
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha criptográfica."); }
    finally { setBusy(false); }
  };

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <div className="segmented"><button className={mode === "encrypt" ? "active" : ""} onClick={() => { setMode("encrypt"); setFile(null); setResult(null); }}><LockKeyhole size={15}/> Criptografar</button><button className={mode === "decrypt" ? "active" : ""} onClick={() => { setMode("decrypt"); setFile(null); setResult(null); }}><UnlockKeyhole size={15}/> Descriptografar</button></div>
        <FileDrop accept={mode === "decrypt" ? ".mediaforge,application/octet-stream" : undefined} onFiles={(files) => setFile(files[0] ?? null)} label={mode === "encrypt" ? "Selecione qualquer arquivo" : "Selecione um .mediaforge"}/>
        <label><span>Senha</span><input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo de 8 caracteres"/></label>
        {mode === "encrypt" ? <label><span>Confirmar senha</span><input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)}/></label> : null}
        <div className="callout compact"><ShieldCheck size={17}/><p>PBKDF2 deriva a chave a partir da senha e AES-GCM protege confidencialidade e integridade. A senha e o arquivo não são enviados ao servidor.</p></div>
        {error ? <p className="error-box">{error}</p> : null}
        <button className="primary-button full" disabled={!file || !password || busy} onClick={run}>{mode === "encrypt" ? <LockKeyhole size={17}/> : <UnlockKeyhole size={17}/>} {busy ? "Processando…" : mode === "encrypt" ? "Criptografar arquivo" : "Descriptografar arquivo"}</button>
      </section>
      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Criptografia local</span><h2>Envelope autenticado</h2></div>{result ? <button className="secondary-button" onClick={() => downloadBlob(result.blob, result.name)}><Download size={16}/> Baixar</button> : null}</div>
        <div className="crypto-diagram"><div><strong>Senha</strong><span>PBKDF2 · SHA-256 · salt aleatório</span></div><span>→</span><div><strong>Chave 256-bit</strong><span>não exportável</span></div><span>→</span><div><strong>AES-GCM</strong><span>IV aleatório + autenticação</span></div></div>
        {result ? <div className="result-banner success"><ShieldCheck size={20}/><div><strong>{result.name}</strong><span>{formatBytes(result.blob.size)} pronto para download</span></div></div> : null}
      </section>
    </div>
  );
}
