
import type { OutputFormat } from "../types";

const EXTENSION_MAP: Record<OutputFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
};

export function buildOutputFileName(sourceName: string, outputFormat: OutputFormat): string {
  const safeName = sourceName.replace(/\.[^/.]+$/, "");
  return `${safeName}-mediaforge.${EXTENSION_MAP[outputFormat]}`;
}
