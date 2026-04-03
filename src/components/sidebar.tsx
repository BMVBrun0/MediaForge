"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: Array<{ href: Route; label: string }> = [
  { href: "/tool", label: "Ferramenta" },
  { href: "/history", label: "Histórico" },
  { href: "/how-it-works", label: "Como usar" },
  { href: "/about", label: "Sobre" },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button type="button" className="sidebar-backdrop" aria-label="Fechar menu" onClick={onClose} />
      <aside className="sidebar-drawer">
        <div className="sidebar-header">
          <div>
            <p className="eyebrow">Menu</p>
            <h2>MediaForge</h2>
          </div>
          <button type="button" className="sidebar-close" onClick={onClose} aria-label="Fechar menu">
            ✕
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação lateral">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? "is-active" : ""}`}
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
