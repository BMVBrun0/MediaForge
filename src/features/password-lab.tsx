"use client";

import { Check, Copy, KeyRound, RefreshCw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { crackTimeLabel, generatePassword, passwordMetrics } from "@/src/lib/crypto";
import { copyText } from "@/src/lib/download";

export function PasswordLab() {
  const [password, setPassword] = useState(() => generatePassword(20, true));
  const [length, setLength] = useState(20);
  const [symbols, setSymbols] = useState(true);
  const metrics = useMemo(() => passwordMetrics(password), [password]);
  const score = Math.min(100, Math.round((metrics.entropy / 90) * 100));
  const checks = [
    ["12+ caracteres", password.length >= 12], ["Minúsculas", metrics.hasLower], ["Maiúsculas", metrics.hasUpper], ["Números", metrics.hasNumber], ["Símbolos", metrics.hasSymbol],
  ] as const;

  const regenerate = () => setPassword(generatePassword(length, symbols));

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <label><span>Senha analisada</span><div className="input-action"><input value={password} onChange={(e) => setPassword(e.target.value)} spellCheck={false}/><button onClick={() => copyText(password)} aria-label="Copiar senha"><Copy size={17}/></button></div></label>
        <label className="range-field"><span>Comprimento do gerador <strong>{length}</strong></span><input type="range" min="12" max="64" value={length} onChange={(e) => setLength(Number(e.target.value))}/></label>
        <label className="toggle-row"><input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)}/><span>Incluir símbolos no gerador</span></label>
        <button className="primary-button full" onClick={regenerate}><RefreshCw size={17}/> Gerar senha segura</button>
        <div className="password-checks">{checks.map(([label, ok]) => <div key={label} className={ok ? "ok" : ""}>{ok ? <Check size={15}/> : <X size={15}/>}<span>{label}</span></div>)}</div>
      </section>
      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Análise de senha</span><h2>Resistência estimada</h2></div></div>
        <div className="strength-gauge"><div className="strength-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><span><strong>{metrics.entropy.toFixed(0)}</strong><small>bits</small></span></div><div><h3>{score >= 80 ? "Muito forte" : score >= 60 ? "Forte" : score >= 40 ? "Moderada" : "Fraca"}</h3><p>Estimativa baseada no tamanho do conjunto de caracteres e comprimento. Não substitui análise contra padrões conhecidos ou vazamentos.</p></div></div>
        <div className="attack-grid"><div><span>1 milhão tentativas/s</span><strong>{crackTimeLabel(metrics.entropy, 1e6)}</strong></div><div><span>1 bilhão tentativas/s</span><strong>{crackTimeLabel(metrics.entropy, 1e9)}</strong></div><div><span>100 bilhões tentativas/s</span><strong>{crackTimeLabel(metrics.entropy, 1e11)}</strong></div></div>
        <div className="callout compact"><KeyRound size={17}/><p>Os cenários são matemáticos e educativos. Sistemas reais variam conforme algoritmo de hash, salt, hardware, rate limiting e reutilização de senhas.</p></div>
      </section>
    </div>
  );
}
