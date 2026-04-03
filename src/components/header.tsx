"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOnlineStatus } from "@/src/lib/hooks/use-online-status";

const navItems = [
  { href: "/tool", label: "Ferramenta" },
  { href: "/history", label: "Histórico" },
  { href: "/how-it-works", label: "Como usar" },
  { href: "/about", label: "Sobre" },
];

export function Header({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();
  const isOnline = useOnlineStatus();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/tool" className="brand">
          <span className="brand-mark">MF</span>
          <span className="brand-copy">
            <strong>MediaForge</strong>
            <small>compressão e conversão de imagens</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? "is-active" : ""}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <span className={`status-badge ${isOnline ? "is-online" : "is-offline"}`}>
            <span className="status-dot" />
            {isOnline ? "Processamento online disponível" : "Sem conexão"}
          </span>

          <button type="button" className="menu-button" onClick={onOpenSidebar} aria-label="Abrir menu">
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
