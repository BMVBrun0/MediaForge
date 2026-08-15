import sharp from "sharp";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 4_000_000;
const MAX_PIXELS = 50_000_000;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
type OutputFormat = "jpeg" | "png" | "webp" | "avif";

function numberValue(value: FormDataEntryValue | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function outputFormat(value: FormDataEntryValue | null): OutputFormat {
  return value === "jpeg" || value === "png" || value === "avif" || value === "webp" ? value : "webp";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Selecione uma imagem." }, { status: 400 });
    if (!SUPPORTED_TYPES.has(file.type)) return Response.json({ error: "Formato de entrada não suportado." }, { status: 415 });
    if (file.size > MAX_FILE_BYTES) return Response.json({ error: "Para esta operação remota, use uma imagem de até 4 MB." }, { status: 413 });

    const quality = numberValue(form.get("quality"), 82, 35, 100);
    const maxWidth = numberValue(form.get("maxWidth"), 0, 0, 8000) || undefined;
    const format = outputFormat(form.get("outputFormat"));
    const input = Buffer.from(await file.arrayBuffer());
    const base = sharp(input, { failOn: "error", limitInputPixels: MAX_PIXELS }).rotate();
    const meta = await base.metadata();
    if ((meta.width ?? 0) * (meta.height ?? 0) > MAX_PIXELS) return Response.json({ error: "A imagem excede o limite de 50 megapixels." }, { status: 413 });

    let pipeline = sharp(input, { failOn: "error", limitInputPixels: MAX_PIXELS }).rotate();
    if (maxWidth) pipeline = pipeline.resize({ width: maxWidth, fit: "inside", withoutEnlargement: true });

    if (format === "jpeg") pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    else if (format === "png") pipeline = pipeline.png({ compressionLevel: 9, progressive: true });
    else if (format === "avif") pipeline = pipeline.avif({ quality, effort: 4 });
    else pipeline = pipeline.webp({ quality, effort: 4 });

    const output = await pipeline.toBuffer();
    const outMeta = await sharp(output).metadata();
    return new Response(new Uint8Array(output), {
      headers: {
        "Content-Type": format === "jpeg" ? "image/jpeg" : `image/${format}`,
        "Cache-Control": "no-store",
        "X-Original-Size": String(input.byteLength),
        "X-Output-Size": String(output.byteLength),
        "X-Output-Width": String(outMeta.width ?? ""),
        "X-Output-Height": String(outMeta.height ?? ""),
      },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Falha ao processar a imagem.";
    return Response.json({ error: message }, { status: 500 });
  }
}
