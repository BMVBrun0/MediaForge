import sharp from "sharp";
import type { OutputFormat, ToolMode } from "@/src/lib/types";

export const runtime = "nodejs";

const SUPPORTED_OUTPUT_FORMATS: OutputFormat[] = ["jpeg", "png", "webp", "avif"];

function clampNumber(input: FormDataEntryValue | null, fallback: number, min: number, max: number): number {
  const value = Number(input);

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}

function optionalNumber(input: FormDataEntryValue | null): number | undefined {
  const value = Number(input);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function normalizeOriginalFormat(format?: string | null): OutputFormat {
  switch (format) {
    case "jpeg":
    case "jpg":
      return "jpeg";
    case "png":
      return "png";
    case "webp":
      return "webp";
    case "avif":
      return "avif";
    default:
      return "webp";
  }
}

function resolveOutputFormat(
  mode: ToolMode,
  requestedOutput: FormDataEntryValue | null,
  originalFormat: OutputFormat,
): OutputFormat {
  if (mode === "compress") {
    return originalFormat;
  }

  if (
    requestedOutput === "jpeg" ||
    requestedOutput === "png" ||
    requestedOutput === "webp" ||
    requestedOutput === "avif"
  ) {
    return requestedOutput;
  }

  return "webp";
}

async function buildOutputBuffer(
  inputBuffer: Buffer,
  outputFormat: OutputFormat,
  quality: number,
  maxWidth?: number,
  maxHeight?: number,
) {
  let pipeline = sharp(inputBuffer).rotate();

  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  switch (outputFormat) {
    case "jpeg":
      return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    case "png":
      return pipeline
        .png({
          compressionLevel: 9,
          quality,
          progressive: true,
          palette: quality < 92,
        })
        .toBuffer();
    case "avif":
      return pipeline.avif({ quality }).toBuffer();
    case "webp":
    default:
      return pipeline.webp({ quality }).toBuffer();
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "O arquivo de imagem é obrigatório." }, { status: 400 });
    }

    const mode = (formData.get("mode") === "convert" ? "convert" : "compress") as ToolMode;
    const quality = clampNumber(formData.get("quality"), 82, 35, 100);
    const maxWidth = optionalNumber(formData.get("maxWidth"));
    const maxHeight = optionalNumber(formData.get("maxHeight"));

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const originalMetadata = await sharp(inputBuffer).metadata();
    const originalFormat = normalizeOriginalFormat(originalMetadata.format);
    const outputFormat = resolveOutputFormat(mode, formData.get("outputFormat"), originalFormat);

    if (!SUPPORTED_OUTPUT_FORMATS.includes(outputFormat)) {
      return Response.json({ error: "Formato de saída não suportado." }, { status: 400 });
    }

    const outputBuffer = await buildOutputBuffer(inputBuffer, outputFormat, quality, maxWidth, maxHeight);
    const outputMetadata = await sharp(outputBuffer).metadata();

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": `image/${outputFormat === "jpeg" ? "jpeg" : outputFormat}`,
        "Content-Disposition": `attachment; filename="resultado.${outputFormat === "jpeg" ? "jpg" : outputFormat}"`,
        "Cache-Control": "no-store",
        "X-Original-Size": String(inputBuffer.byteLength),
        "X-Output-Size": String(outputBuffer.byteLength),
        "X-Output-Format": outputFormat,
        "X-Output-Width": String(outputMetadata.width ?? ""),
        "X-Output-Height": String(outputMetadata.height ?? ""),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao processar a imagem.";
    return Response.json({ error: message }, { status: 500 });
  }
}
