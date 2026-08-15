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
