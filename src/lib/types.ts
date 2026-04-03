export type ToolMode = "compress" | "convert";
export type OutputFormat = "jpeg" | "png" | "webp" | "avif";
export type QueueStatus = "queued" | "processing" | "done" | "error";

export interface ProcessOptions {
  mode: ToolMode;
  outputFormat: OutputFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface QueueItem {
  id: string;
  file: File;
  sourceUrl: string;
  status: QueueStatus;
  sourceName: string;
  sourceSize: number;
  sourceType: string;
  outputUrl?: string;
  outputName?: string;
  outputSize?: number;
  outputType?: string;
  width?: number;
  height?: number;
  message?: string;
}

export interface HistoryRecord {
  id: string;
  name: string;
  createdAt: string;
  mode: ToolMode;
  outputFormat: OutputFormat;
  quality: number;
  originalSize: number;
  outputSize: number;
  outputType: string;
  width?: number;
  height?: number;
  blob: Blob;
}

export interface PersistedHistoryRecord extends HistoryRecord {}

export type InfoTab = "historico" | "guia" | "sobre";
