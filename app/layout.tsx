import type { Metadata } from "next";
import "./globals.css";
import { AppFrame } from "@/src/components/app-frame";

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
      </body>
    </html>
  );
}
