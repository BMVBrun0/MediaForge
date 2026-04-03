import type { Metadata } from "next";
import Script from "next/script";
import { AppFrame } from "@/src/components/app-frame";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediaForge",
  description:
    "Ferramenta web para compactação e conversão de imagens, com fila de processamento e histórico local.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
                endpoint: "https://accessibility-widget-xi.vercel.app/api/license",
                skipOnLocalhost: true
              }
            };
          `}
        </Script>

        <Script
          src="https://accessibility-widget-xi.vercel.app/dist/accessibility-widget.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}