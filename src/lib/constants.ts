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


export const INFO_TABS: Array<{ value: import("./types").InfoTab; label: string; caption: string }> = [
  { value: "historico", label: "Histórico", caption: "Arquivos processados e downloads recentes" },
  { value: "guia", label: "Guia", caption: "Passo a passo rápido para usar a ferramenta" },
  { value: "sobre", label: "Sobre", caption: "Contexto técnico e objetivo do projeto" },
];

export const GUIDE_STEPS: Array<{ title: string; description: string }> = [
  { title: "Envie as imagens", description: "Selecione um arquivo ou um lote para iniciar o fluxo de compressão ou conversão." },
  { title: "Escolha o modo", description: "Use Compactar para reduzir peso ou Converter para trocar o formato de saída." },
  { title: "Ajuste qualidade e dimensões", description: "Defina qualidade, largura máxima e altura máxima conforme o destino do arquivo." },
  { title: "Processe e baixe", description: "Revise o resultado na fila e faça o download do arquivo otimizado quando terminar." },
];

export const ABOUT_ITEMS: Array<{ title: string; description: string }> = [
  { title: "Processamento real", description: "A aplicação usa uma rota Node com Sharp para compactar e converter imagens de verdade." },
  { title: "Estrutura simples", description: "O projeto está organizado para facilitar manutenção, testes e evolução futura." },
  { title: "Histórico local", description: "Os resultados ficam disponíveis no navegador para revisão e downloads repetidos." },
  { title: "Base para expansão", description: "A arquitetura já abre espaço para presets, comparação antes/depois e novas ferramentas." },
];
