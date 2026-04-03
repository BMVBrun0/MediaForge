const steps = [
  {
    title: "1. Escolha as imagens",
    text: "Envie um arquivo ou um lote inteiro. O MediaForge aceita PNG, JPEG, WebP, AVIF, GIF e TIFF.",
  },
  {
    title: "2. Selecione o modo",
    text: "Use Compactar para reduzir o tamanho mantendo o formato original quando possível. Use Converter para trocar o formato final da saída.",
  },
  {
    title: "3. Ajuste a saída",
    text: "Defina qualidade, largura máxima e altura máxima para preparar arquivos para web, portfólio, catálogo ou uso geral.",
  },
  {
    title: "4. Processe e baixe",
    text: "A fila mostra prévia, tamanho original, tamanho final, redução percentual e acesso rápido ao download.",
  },
];

const tips = [
  "JPEG costuma funcionar melhor para fotos e compatibilidade ampla.",
  "WebP entrega bom equilíbrio entre peso e qualidade para web.",
  "AVIF tende a compactar mais, mas nem sempre é a melhor opção para todos os fluxos.",
  "Se o objetivo for apenas reduzir peso, prefira o modo Compactar.",
];

export default function HowItWorksPage() {
  return (
    <section className="page-section">
      <div className="container page-stack">
        <div className="page-heading narrow-heading">
          <div>
            <p className="eyebrow">Como usar</p>
            <h1>Fluxo simples, com foco na ferramenta e no resultado.</h1>
            <p className="lead">
              Esta página resume o caminho ideal para testar o MediaForge sem encher a tela principal de texto.
            </p>
          </div>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <article key={step.title} className="content-card step-card">
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </article>
          ))}
        </div>

        <section className="content-card notes-card">
          <div className="section-row">
            <div>
              <p className="eyebrow">Dicas rápidas</p>
              <h2>Escolhas úteis para começar</h2>
            </div>
          </div>

          <ul className="bullet-list">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
