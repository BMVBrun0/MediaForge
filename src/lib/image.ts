import type { RgbColor } from "./types";

export async function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function canvasFromFile(file: File | Blob, maxDimension?: number) {
  const image = await fileToImage(file);
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (maxDimension && Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D indisponível.");
  context.drawImage(image, 0, 0, width, height);
  return { canvas, context, width, height };
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("O navegador não conseguiu gerar o arquivo de saída."));
    }, type, quality);
  });
}

export function colorDistance(a: RgbColor, b: RgbColor) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

export function rgbToHex({ r, g, b }: RgbColor) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function hexToRgb(hex: string): RgbColor | null {
  const normalized = hex.trim().replace(/^#/, "");
  const value = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export function averageBorderColor(imageData: ImageData, thickness = 10): RgbColor {
  const { width, height, data } = imageData;
  let r = 0, g = 0, b = 0, count = 0;
  const edge = Math.max(1, Math.min(thickness, Math.floor(Math.min(width, height) / 4)));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x >= edge && x < width - edge && y >= edge && y < height - edge) continue;
      const index = (y * width + x) * 4;
      if (data[index + 3] < 20) continue;
      r += data[index];
      g += data[index + 1];
      b += data[index + 2];
      count += 1;
    }
  }

  if (!count) return { r: 255, g: 255, b: 255 };
  return { r: r / count, g: g / count, b: b / count };
}

export function removeEdgeConnectedBackground(
  imageData: ImageData,
  background: RgbColor,
  tolerance: number,
  softness: number,
) {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixel = y * width + x;
    if (visited[pixel]) return;
    visited[pixel] = 1;
    queue[tail++] = pixel;
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  const threshold = Math.max(1, tolerance);
  const feather = Math.max(1, softness);

  while (head < tail) {
    const pixel = queue[head++];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const offset = pixel * 4;
    const distance = colorDistance(
      { r: data[offset], g: data[offset + 1], b: data[offset + 2] },
      background,
    );

    if (distance > threshold + feather) continue;

    if (distance <= threshold) {
      data[offset + 3] = 0;
    } else {
      const alpha = Math.round(255 * ((distance - threshold) / feather));
      data[offset + 3] = Math.min(data[offset + 3], alpha);
    }

    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  return imageData;
}

export async function resizeImageBlob(file: File | Blob, size: number, type = "image/png") {
  const image = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível.");
  ctx.clearRect(0, 0, size, size);
  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  return canvasToBlob(canvas, type, 0.95);
}
