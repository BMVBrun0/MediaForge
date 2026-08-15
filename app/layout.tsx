import type { Metadata } from "next";
import Script from "next/script";
import { AppFrame } from "@/src/components/app-frame";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediaForge — Ferramentas de mídia e arquivos",
  description: "Ferramentas de imagem, vídeo, segurança de arquivos e recursos visuais em uma única interface.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppFrame>{children}</AppFrame>
        <Script id="accessibility-widget-config" strategy="beforeInteractive">
          {`
            window.AccessibilityWidgetConfig = {
              appName: "MediaForge",
              storageKey: "mediaforge-accessibility",
              license: {
                siteId: "mediaforge-production",
                endpoint: "https://accessibility-widget-xi.vercel.app/api/license"
              }
            };
          `}
        </Script>
        <Script src="https://accessibility-widget-xi.vercel.app/dist/latest/accessibility-widget.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
