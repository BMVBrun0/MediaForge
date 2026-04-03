const pillars = [
  {
    title: "Next.js + TypeScript",
    text: "Estrutura moderna para páginas, rotas, tipagem forte e evolução futura do projeto público.",
  },
  {
    title: "Processamento com Sharp",
    text: "A compactação e a conversão acontecem em uma rota Node real, sem depender de mock visual para parecer funcional.",
  },
  {
    title: "Histórico local com IndexedDB",
    text: "Os resultados ficam salvos no navegador para demonstrar persistência local e facilitar testes repetidos.",
  },
  {
    title: "Base pronta para expansão",
    text: "A organização atual já abre espaço para presets, comparação antes/depois, contas, jobs em segundo plano e novas ferramentas.",
  },
];

export default function AboutPage() {
  return (
    <section className="page-section">
      <div className="container page-stack">
        <div className="page-heading narrow-heading">
          <div>
            <p className="eyebrow">Sobre</p>
            <h1>Uma base pública para processamento de imagens na web.</h1>
            <p className="lead">
              O foco do MediaForge é demonstrar estrutura limpa, experiência de uso clara e processamento de imagem que realmente acontece.
            </p>
          </div>
        </div>

        <div className="cards-grid cards-grid-2">
          {pillars.map((pillar) => (
            <article className="content-card" key={pillar.title}>
              <h2>{pillar.title}</h2>
              <p>{pillar.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
