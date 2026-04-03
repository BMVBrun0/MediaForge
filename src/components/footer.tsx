import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-copy">
          <strong>MediaForge</strong>
          <p>Ferramenta web para compactar, converter e acompanhar resultados de imagem.</p>
        </div>

        <div className="footer-links">
          <Link href="/tool">Ferramenta</Link>
          <Link href="/history">Histórico</Link>
          <Link href="/how-it-works">Como usar</Link>
          <Link href="/about">Sobre</Link>
        </div>
      </div>
    </footer>
  );
}
