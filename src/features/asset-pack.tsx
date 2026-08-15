"use client";

import JSZip from "jszip";
import { Download, PackageOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { FileDrop } from "@/src/components/file-drop";
import { resizeImageBlob } from "@/src/lib/image";
import { downloadBlob } from "@/src/lib/download";
import { saveArtifact } from "@/src/lib/history";

const ICONS = [
  [16, "favicon-16x16.png"], [32, "favicon-32x32.png"], [48, "favicon-48x48.png"],
  [180, "apple-touch-icon.png"], [192, "pwa-192x192.png"], [512, "pwa-512x512.png"],
  [48, "android/mipmap-mdpi/ic_launcher.png"], [72, "android/mipmap-hdpi/ic_launcher.png"],
  [96, "android/mipmap-xhdpi/ic_launcher.png"], [144, "android/mipmap-xxhdpi/ic_launcher.png"],
  [192, "android/mipmap-xxxhdpi/ic_launcher.png"],
] as const;

export function AssetPack() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const source = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);

  const generate = async () => {
    if (!file) return;
    setBusy(true); setStatus("Gerando tamanhos…");
    try {
      const zip = new JSZip();
      for (const [size, path] of ICONS) {
        const blob = await resizeImageBlob(file, size);
        zip.file(path, blob);
      }
      zip.file("site.webmanifest", JSON.stringify({ name: "App", short_name: "App", icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }, { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" }], display: "standalone" }, null, 2));
      setStatus("Compactando ZIP…");
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      downloadBlob(blob, "mediaforge-asset-pack.zip");
      await saveArtifact({ toolId: "asset-pack", title: `Pacote de assets — ${file.name}`, summary: `${ICONS.length} ícones + webmanifest`, outputName: "mediaforge-asset-pack.zip", outputType: "application/zip", outputSize: blob.size, blob });
      setStatus("Pacote gerado com sucesso.");
    } finally { setBusy(false); }
  };

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <FileDrop accept="image/png,image/jpeg,image/webp" onFiles={(files) => setFile(files[0] ?? null)} label="Selecione o ícone base" hint="Prefira uma imagem quadrada em alta resolução"/>
        <div className="asset-size-list">{ICONS.map(([size, path]) => <div key={`${path}-${size}`}><span>{size}×{size}</span><strong>{path}</strong></div>)}</div>
        {status ? <p className="status-line">{status}</p> : null}
        <button className="primary-button full" disabled={!file || busy} onClick={generate}><PackageOpen size={17}/>{busy ? "Gerando…" : "Gerar pacote ZIP"}</button>
      </section>
      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Múltiplas plataformas</span><h2>Pré-visualização do ícone</h2></div></div>
        {source ? <div className="icon-preview-board"><div className="icon-preview light"><img src={source} alt="Ícone em fundo claro"/></div><div className="icon-preview dark"><img src={source} alt="Ícone em fundo escuro"/></div><div className="icon-preview rounded"><img src={source} alt="Ícone arredondado"/></div></div> : <div className="empty-preview large"><Download size={30}/> O pacote inclui tamanhos para navegador, PWA, iOS e Android.</div>}
      </section>
    </div>
  );
}
