"use client";

import * as Icons from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CATEGORY_META, getTool, TOOLS } from "@/src/lib/tools";
import type { ToolCategory } from "@/src/lib/types";
import { ToolRenderer } from "./tool-renderer";

function ToolIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name] ?? Icons.Box;
  return <Icon size={size} />;
}

export function ToolWorkbench({ toolId }: { toolId: string }) {
  const tool = getTool(toolId);
  const categories = Object.keys(CATEGORY_META) as ToolCategory[];
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="workspace-layout">
      <aside className="tool-sidebar">
        <div className="sidebar-intro">
          <span className="eyebrow">Área de trabalho</span>
          <h2>Ferramentas</h2>
          <p>Escolha um fluxo e processe sem trocar de aplicação.</p>
        </div>
        <div className="tool-nav-groups">
          {categories.map((category) => (
            <section key={category} className="tool-nav-group">
              <div className="tool-nav-heading">
                <strong>{CATEGORY_META[category].label}</strong>
              </div>
              {TOOLS.filter((item) => item.category === category).map((item) => (
                <Link key={item.id} href={`/studio/${item.id}`} className={`tool-nav-item ${item.id === tool.id ? "active" : ""}`}>
                  <span className="tool-nav-icon"><ToolIcon name={item.icon} /></span>
                  <span><strong>{item.shortName}</strong><small>{item.localOnly ? "No dispositivo" : "Híbrido"}</small></span>
                  {item.badge ? <em>{item.badge}</em> : null}
                </Link>
              ))}
            </section>
          ))}
        </div>
      </aside>

      <section className="tool-stage">
        <header className="tool-stage-header">
          <div className="tool-title-icon"><ToolIcon name={tool.icon} size={24} /></div>
          <div className="tool-stage-copy">
            <div className="tool-title-row">
              <span className="eyebrow">{CATEGORY_META[tool.category].label}</span>
              {tool.localOnly ? <span className="privacy-pill"><Icons.Shield size={13} /> processamento local</span> : <span className="hybrid-pill"><Icons.ServerCog size={13} /> processamento híbrido</span>}
            </div>
            <h1>{tool.name}</h1>
            <p>{tool.description}</p>
          </div>
          <button
            className={`tool-help-button ${helpOpen ? "active" : ""}`}
            type="button"
            aria-expanded={helpOpen}
            aria-label={`Como usar ${tool.shortName}`}
            title="Como usar esta ferramenta"
            onClick={() => setHelpOpen((value) => !value)}
          >
            {helpOpen ? <Icons.X size={20} /> : <Icons.CircleHelp size={20} />}
          </button>
        </header>

        {helpOpen ? (
          <section className="tool-help-card" aria-label={`Tutorial de ${tool.shortName}`}>
            <div className="tool-help-intro">
              <span className="eyebrow">Como testar / usar</span>
              <h2>{tool.help.summary}</h2>
            </div>
            <div className="tool-help-grid">
              <div>
                <strong>O que usar</strong>
                <p>{tool.help.input}</p>
              </div>
              <div>
                <strong>Passo a passo</strong>
                <ol>{tool.help.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              </div>
              <div>
                <strong>Resultado esperado</strong>
                <p>{tool.help.expected}</p>
                {tool.help.note ? <small>{tool.help.note}</small> : null}
              </div>
            </div>
          </section>
        ) : null}

        <ToolRenderer toolId={tool.id} />
      </section>
    </div>
  );
}
