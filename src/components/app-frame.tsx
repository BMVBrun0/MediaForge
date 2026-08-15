"use client";

import * as Icons from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORY_META, TOOLS } from "@/src/lib/tools";
import type { ToolCategory } from "@/src/lib/types";

function ToolIcon({ name }: { name: string }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name] ?? Icons.Box;
  return <Icon size={17} />;
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const categories = Object.keys(CATEGORY_META) as ToolCategory[];

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const closeOnDesktop = () => { if (window.innerWidth > 860) setMobileOpen(false); };
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/studio/image-optimize" className="brand-lockup" aria-label="MediaForge">
            <img className="brand-logo" src="/mediaforge-logo.png" alt="MediaForge" />
          </Link>
          <nav className="topnav" aria-label="Navegação principal">
            <Link className={pathname.startsWith("/studio") ? "active" : ""} href="/studio/image-optimize">Início</Link>
            <Link className={pathname === "/history" ? "active" : ""} href="/history"><Icons.Clock3 size={16} /> Histórico</Link>
          </nav>
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Fechar navegação" : "Abrir navegação"}
            aria-expanded={mobileOpen}
            type="button"
          >
            {mobileOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="mobile-drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileOpen(false); }}>
          <aside className="mobile-drawer" aria-label="Navegação mobile">
            <div className="mobile-drawer-head">
              <div><span className="eyebrow">Navegação</span><strong>MediaForge</strong></div>
              <button className="icon-button" type="button" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><Icons.X size={19}/></button>
            </div>
            <nav className="mobile-primary-links">
              <Link className={pathname.startsWith("/studio") ? "active" : ""} href="/studio/image-optimize"><Icons.Home size={17}/> Início</Link>
              <Link className={pathname === "/history" ? "active" : ""} href="/history"><Icons.Clock3 size={17}/> Histórico</Link>
            </nav>
            <div className="mobile-tool-groups">
              {categories.map((category) => (
                <section key={category}>
                  <div className="mobile-tool-heading">{CATEGORY_META[category].label}</div>
                  {TOOLS.filter((tool) => tool.category === category).map((tool) => (
                    <Link key={tool.id} href={`/studio/${tool.id}`} className={pathname === `/studio/${tool.id}` ? "active" : ""}>
                      <span><ToolIcon name={tool.icon}/></span>
                      <strong>{tool.shortName}</strong>
                      {tool.badge ? <em>{tool.badge}</em> : null}
                    </Link>
                  ))}
                </section>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <main>{children}</main>
      <footer className="app-footer">
        <span>MediaForge</span>
        <span>Processamento sensível priorizado no dispositivo.</span>
      </footer>
    </div>
  );
}
