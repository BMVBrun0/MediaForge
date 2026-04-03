import { ABOUT_ITEMS, GUIDE_STEPS, INFO_TABS } from "@/src/lib/constants";
import type { InfoTab, PersistedHistoryRecord } from "@/src/lib/types";
import { HistoryPanel } from "./history-panel";

interface InfoTabsProps {
  activeTab: InfoTab;
  onTabChange: (tab: InfoTab) => void;
  history: PersistedHistoryRecord[];
  isHydrating: boolean;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function InfoTabs({
  activeTab,
  onTabChange,
  history,
  isHydrating,
  onDelete,
  onClearAll,
}: InfoTabsProps) {
  return (
    <section className="section section-tight" id="extras">
      <div className="container stack-large">
        <div className="tabs-shell">
          <div className="tabs-list" role="tablist" aria-label="Navegação secundária">
            {INFO_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                className={activeTab === tab.value ? "is-active" : ""}
                onClick={() => onTabChange(tab.value)}
              >
                <strong>{tab.label}</strong>
                <small>{tab.caption}</small>
              </button>
            ))}
          </div>

          <div className="tabs-content">
            {activeTab === "historico" ? (
              <HistoryPanel
                history={history}
                isHydrating={isHydrating}
                onDelete={onDelete}
                onClearAll={onClearAll}
              />
            ) : null}

            {activeTab === "guia" ? (
              <section className="tab-panel" aria-label="Como usar" id="guia-panel">
                <div className="panel-toolbar single-column">
                  <div>
                    <p className="section-kicker">Como usar</p>
                    <h2>Fluxo rápido para testar a ferramenta</h2>
                    <p className="section-copy">
                      O MediaForge foi pensado para permitir teste rápido de compressão e conversão em poucos passos.
                    </p>
                  </div>
                </div>

                <div className="guide-grid">
                  {GUIDE_STEPS.map((step) => (
                    <article className="guide-card" key={step.title}>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === "sobre" ? (
              <section className="tab-panel" aria-label="Sobre o projeto" id="sobre-panel">
                <div className="panel-toolbar single-column">
                  <div>
                    <p className="section-kicker">Sobre o MediaForge</p>
                    <h2>Uma base pública para processamento de imagens na web</h2>
                    <p className="section-copy">
                      O foco desta versão é demonstrar estrutura, experiência de uso e processamento real com foco em imagem.
                    </p>
                  </div>
                </div>

                <div className="about-grid-responsive">
                  {ABOUT_ITEMS.map((item) => (
                    <article className="about-card-v2" key={item.title}>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
