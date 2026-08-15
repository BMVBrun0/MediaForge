"use client";

import { Download, MapPin, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as exifr from "exifr";
import { FileDrop } from "@/src/components/file-drop";
import { canvasFromFile, canvasToBlob } from "@/src/lib/image";
import { downloadBlob } from "@/src/lib/download";
import { formatBytes } from "@/src/lib/format";
import { heicToJpeg, looksLikeHeic } from "@/src/lib/heic";
import { saveArtifact } from "@/src/lib/history";

function displayValue(value: unknown) {
  if (value instanceof Date) return value.toLocaleString("pt-BR");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value ?? "");
}

function outputNameFor(file: File, type: string) {
  const extension = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return `${file.name.replace(/\.[^.]+$/, "")}-clean.${extension}`;
}

export function MetadataCleaner() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [cleaned, setCleaned] = useState<{ blob: Blob; url: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const source = useMemo(() => file && !looksLikeHeic(file, file.name) ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => () => { if (source) URL.revokeObjectURL(source); }, [source]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => () => { if (cleaned?.url) URL.revokeObjectURL(cleaned.url); }, [cleaned]);

  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null).slice(0, 70);
  const sensitiveEntries = entries.filter(([key]) => !["FileName", "FileSize", "MIMEType", "LastModified"].includes(key));
  const hasGps = ["latitude", "longitude", "GPSLatitude", "GPSLongitude"].some((key) => key in metadata);
  const isHeic = file ? looksLikeHeic(file, file.name) : false;

  const inspect = async (input: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (cleaned?.url) URL.revokeObjectURL(cleaned.url);
    setFile(input);
    setCleaned(null);
    setPreviewUrl("");
    setError("");
    setStatus(looksLikeHeic(input, input.name) ? "Lendo HEIC/HEIF e preparando pré-visualização local…" : "Inspecionando metadados…");
    try {
      const metadataPromise = exifr.parse(input, { tiff: true, exif: true, gps: true, xmp: true, iptc: true, icc: false });
      if (looksLikeHeic(input, input.name)) {
        const converted = await heicToJpeg(input, 0.94);
        setPreviewUrl(URL.createObjectURL(converted));
      }
      const result = await metadataPromise;
      setMetadata(result ?? {});
      setStatus("");
    } catch (cause) {
      setMetadata({});
      setStatus("");
      setError(cause instanceof Error ? cause.message : "Não foi possível inspecionar a imagem.");
    }
  };

  const clean = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setStatus(isHeic ? "Convertendo HEIC/HEIF e removendo metadados…" : "Recriando a imagem sem os blocos de metadados…");
    const originalEntries = sensitiveEntries.length;
    const originalHasGps = hasGps;
    try {
      const sourceBlob: File | Blob = isHeic ? await heicToJpeg(file, 0.95) : file;
      const { canvas } = await canvasFromFile(sourceBlob, 5000);
      const outputType = isHeic ? "image/jpeg" : file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
      const blob = await canvasToBlob(canvas, outputType, 0.94);
      const name = outputNameFor(file, outputType);
      const url = URL.createObjectURL(blob);
      if (cleaned?.url) URL.revokeObjectURL(cleaned.url);
      setCleaned({ blob, url, name });

      // Reinspect the generated copy so the panel reflects the CLEAN file instead
      // of continuing to show metadata from the original upload.
      const cleanFile = new File([blob], name, { type: outputType, lastModified: Date.now() });
      const cleanMetadata = await exifr.parse(cleanFile, { tiff: true, exif: true, gps: true, xmp: true, iptc: true, icc: false });
      setMetadata(cleanMetadata ?? {});
      setStatus("Cópia limpa verificada: o painel agora mostra os dados do arquivo gerado.");

      await saveArtifact({
        toolId: "metadata-cleaner",
        title: `Metadados removidos — ${file.name}`,
        summary: `${originalEntries} campos de imagem inspecionados${originalHasGps ? " · localização detectada" : ""}${isHeic ? " · HEIC convertido para JPEG" : ""}`,
        outputName: name,
        outputType,
        outputSize: blob.size,
        blob,
      });
    } catch (cause) {
      setStatus("");
      setError(cause instanceof Error ? cause.message : "Não foi possível limpar a imagem.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-grid two-column">
      <section className="panel-card controls-panel">
        <FileDrop
          accept="image/*,.heic,.heif,image/heic,image/heif"
          onFiles={(files) => files[0] && inspect(files[0])}
          label="Selecione uma foto ou imagem"
          hint="JPEG, PNG, WebP, HEIC ou HEIF"
        />
        {file ? <div className="selected-file"><ShieldCheck size={18}/><span><strong>{file.name}</strong><small>{formatBytes(file.size)} · {sensitiveEntries.length} campos de imagem encontrados{isHeic ? " · HEIC/HEIF" : ""}</small></span></div> : null}
        {hasGps ? <div className="warning-box"><MapPin size={18}/><div><strong>Localização encontrada</strong><span>O arquivo contém coordenadas ou campos GPS.</span></div></div> : null}
        <div className="callout compact"><ShieldCheck size={17}/><p>{isHeic ? "HEIC/HEIF é decodificado localmente no navegador e a cópia limpa é exportada em JPEG. " : ""}A cópia limpa é recriada a partir dos pixels, sem reaproveitar os blocos EXIF/XMP/IPTC do arquivo original.</p></div>
        {status ? <p className="status-line">{status}</p> : null}
        {error ? <p className="error-box">{error}</p> : null}
        <button className="primary-button full" disabled={!file || busy} onClick={clean}><Trash2 size={17}/> {busy ? "Limpando…" : "Remover metadados"}</button>
      </section>
      <section className="panel-card preview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Inspeção</span><h2>Metadados encontrados</h2></div>{cleaned ? <button className="secondary-button" onClick={() => downloadBlob(cleaned.blob, cleaned.name)}><Download size={16}/> Baixar limpo</button> : null}</div>
        {file ? <div className="privacy-preview-row"><div className="privacy-image-wrap">{cleaned?.url || previewUrl || source ? <img src={cleaned?.url || previewUrl || source} alt="Pré-visualização"/> : <div className="empty-preview">Preparando pré-visualização…</div>}{cleaned ? <span className="clean-badge">Cópia limpa</span> : null}</div><div className="metadata-list">{entries.length ? entries.map(([key, value]) => <div key={key}><strong>{key}</strong><span>{displayValue(value)}</span></div>) : <p className="muted-copy">Nenhum metadado EXIF relevante foi encontrado.</p>}</div></div> : <div className="empty-preview large">Selecione uma imagem para inspecionar EXIF, GPS e outros campos. Fotos HEIC/HEIF de iPhone também são aceitas.</div>}
      </section>
    </div>
  );
}
