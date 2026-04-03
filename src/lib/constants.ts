import type { OutputFormat, ProcessOptions, ToolMode } from "./types";

export const TOOL_MODES: Array<{ value: ToolMode; label: string; description: string }> = [
  {
    value: "compress",
    label: "Compactar",
    description: "Reduz o peso do arquivo e preserva o formato original sempre que isso fizer sentido.",
  },
  {
    value: "convert",
    label: "Converter",
    description: "Troca o formato final da imagem e também aplica otimização na saída.",
  },
];

export const OUTPUT_FORMATS: Array<{ value: OutputFormat; label: string; hint: string }> = [
  { value: "jpeg", label: "JPEG", hint: "boa compatibilidade para fotos" },
  { value: "png", label: "PNG", hint: "mantém transparência" },
  { value: "webp", label: "WebP", hint: "equilíbrio entre peso e qualidade" },
  { value: "avif", label: "AVIF", hint: "compressão forte em navegadores modernos" },
];

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/avif,image/gif,image/tiff";

export const QUICK_PRESETS: Array<{ id: string; label: string; options: Partial<ProcessOptions> }> = [
  {
    id: "web-leve",
    label: "Web leve",
    options: { mode: "convert", outputFormat: "webp", quality: 76, maxWidth: 1920 },
  },
  {
    id: "portifolio",
    label: "Portfólio",
    options: { mode: "convert", outputFormat: "jpeg", quality: 88, maxWidth: 2200 },
  },
  {
    id: "produto",
    label: "Produto",
    options: { mode: "convert", outputFormat: "png", quality: 90, maxWidth: 1800 },
  },
  {
    id: "rapido",
    label: "Rápido",
    options: { mode: "compress", quality: 70 },
  },
];
