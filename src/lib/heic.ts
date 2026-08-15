"use client";

type HeicOptions = {
  blob: Blob;
  type: "image/jpeg" | "image/png" | "bitmap";
  quality?: number;
  options?: Record<string, unknown>;
};

type HeicRuntime = ((options: HeicOptions) => Promise<Blob | Blob[] | ImageBitmap>) & {
  isHeic?: (blob: Blob) => Promise<boolean>;
  heicTo?: (options: HeicOptions) => Promise<Blob | Blob[] | ImageBitmap>;
};

declare global {
  interface Window {
    HeicTo?: HeicRuntime;
  }
}

let loading: Promise<HeicRuntime> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-mediaforge-heic-src="${src}"]`);
    if (existing) {
      if (window.HeicTo) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar o decoder HEIC.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.mediaforgeHeicSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o decoder HEIC."));
    document.head.appendChild(script);
  });
}

async function getRuntime() {
  if (window.HeicTo) return window.HeicTo;
  if (loading) return loading;

  loading = (async () => {
    const sources = [
      "https://cdn.jsdelivr.net/npm/heic-to@1.5.2/dist/iife/heic-to.js",
      "https://unpkg.com/heic-to@1.5.2/dist/iife/heic-to.js",
    ];
    let lastError: unknown;
    for (const source of sources) {
      try {
        await loadScript(source);
        if (window.HeicTo) return window.HeicTo;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Não foi possível carregar o decoder HEIC. Verifique sua conexão e tente novamente.");
  })();

  try {
    return await loading;
  } finally {
    loading = null;
  }
}

export function looksLikeHeic(file: File | Blob, name = "") {
  const type = (file.type || "").toLowerCase();
  const fileName = name.toLowerCase();
  return type === "image/heic" || type === "image/heif" || /\.(heic|heif)$/i.test(fileName);
}

export async function heicToJpeg(input: File | Blob, quality = 0.94): Promise<Blob> {
  const runtime = await getRuntime();
  const converter = typeof runtime === "function" ? runtime : runtime.heicTo;
  if (!converter) throw new Error("Decoder HEIC carregado sem a API de conversão esperada.");
  const output = await converter({ blob: input, type: "image/jpeg", quality });
  const first = Array.isArray(output) ? output[0] : output;
  if (!(first instanceof Blob)) throw new Error("O decoder HEIC não retornou uma imagem válida.");
  return first.type === "image/jpeg" ? first : new Blob([await first.arrayBuffer()], { type: "image/jpeg" });
}
