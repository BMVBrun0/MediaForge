"use client";

import { useEffect, useState } from "react";
import { Footer } from "./footer";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { ToolStudio } from "./tool-studio";
import { useOnlineStatus } from "@/src/lib/hooks/use-online-status";
import type { InfoTab } from "@/src/lib/types";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InfoTab>("historico");
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNavigate = (target: "ferramenta" | InfoTab) => {
    if (target === "ferramenta") {
      scrollToId("ferramenta");
      return;
    }

    setActiveTab(target);
    window.requestAnimationFrame(() => {
      scrollToId("extras");
    });
  };

  return (
    <>
      <Header isOnline={isOnline} onOpenSidebar={() => setSidebarOpen(true)} onNavigate={handleNavigate} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={handleNavigate} />
      <main>
        <ToolStudio isOnline={isOnline} activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
      <Footer onNavigate={handleNavigate} />
    </>
  );
}
