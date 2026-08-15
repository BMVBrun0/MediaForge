export type ToolCategory = "image" | "video" | "security" | "assets";

export interface ToolHelp {
  summary: string;
  input: string;
  steps: string[];
  expected: string;
  note?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: ToolCategory;
  icon: string;
  badge?: string;
  localOnly?: boolean;
  help: ToolHelp;
}

export interface ArtifactRecord {
  id: string;
  toolId: string;
  title: string;
  summary: string;
  createdAt: string;
  outputName?: string;
  outputType?: string;
  outputSize?: number;
  blob?: Blob;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

// Compatibility types used by the legacy image workflow that is still part of the project.
// Keeping them here allows Next.js to type-check every TS/TSX file during production builds.
export type ToolMode = "compress" | "convert";
export type OutputFormat = "jpeg" | "png" | "webp" | "avif";
export type InfoTab = "historico" | "guia" | "sobre";

export interface ProcessOptions {
  mode: ToolMode;
  outputFormat: OutputFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

export type QueueStatus = "idle" | "processing" | "done" | "error";

export interface QueueItem {
  id: string;
  sourceName: string;
  sourceType: string;
  sourceSize: number;
  sourceUrl: string;
  status: QueueStatus;
  outputUrl?: string;
  outputName?: string;
  outputType?: string;
  outputSize?: number;
  width?: number;
  height?: number;
  message?: string;
}

export interface PersistedHistoryRecord {
  id: string;
  name: string;
  createdAt: string;
  outputFormat: string;
  mode: ToolMode;
  originalSize: number;
  outputSize: number;
  width?: number;
  height?: number;
  outputType: string;
  blob: Blob;
}

