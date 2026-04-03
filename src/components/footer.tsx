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
          <Link href="/ferramenta">Ferramenta</Link>
          <Link href="/historico">Histórico</Link>
          <Link href="/como-usar">Como usar</Link>
          <Link href="/sobre">Sobre</Link>
        </div>
      </div>
    </footer>
  );
}
