import { describe, expect, it } from "vitest";
import { contrastRatio, harmony, hslToRgb, rgbToHsl } from "@/src/lib/color";
import { crackTimeLabel, generatePassword, passwordMetrics } from "@/src/lib/crypto";
import { formatBytes, formatPercent } from "@/src/lib/format";
import { hexToRgb, rgbToHex } from "@/src/lib/image";
import { getTool, TOOLS } from "@/src/lib/tools";
import JSZip from "@/src/lib/jszip";

async function blobBytes(blob: Blob) {
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
  return new Uint8Array(buffer);
}

describe("MediaForge core", () => {
  it("registers a broad tool suite without duplicate ids", () => {
    expect(TOOLS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(TOOLS.map((tool) => tool.id)).size).toBe(TOOLS.length);
    expect(getTool("video-lab").category).toBe("video");
  });

  it("falls back to image optimizer for unknown routes", () => {
    expect(getTool("unknown").id).toBe("image-optimize");
  });

  it("formats file sizes and percentages", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatPercent(42.345)).toBe("42.3%");
  });

  it("converts HEX and RGB", () => {
    expect(hexToRgb("#7C5CFF")).toEqual({ r: 124, g: 92, b: 255 });
    expect(rgbToHex({ r: 124, g: 92, b: 255 })).toBe("#7C5CFF");
  });

  it("round-trips RGB through HSL", () => {
    const original = { r: 124, g: 92, b: 255 };
    const roundTrip = hslToRgb(rgbToHsl(original));
    expect(Math.abs(roundTrip.r - original.r)).toBeLessThan(1);
    expect(Math.abs(roundTrip.g - original.g)).toBeLessThan(1);
    expect(Math.abs(roundTrip.b - original.b)).toBeLessThan(1);
  });

  it("calculates WCAG-style contrast ratio boundaries", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 2);
  });

  it("builds six color harmonies", () => {
    const colors = harmony("#7C5CFF");
    expect(colors).toHaveLength(6);
    expect(colors[0]).toBe("#7C5CFF");
  });

  it("estimates password entropy from character classes", () => {
    const weak = passwordMetrics("password");
    const strong = passwordMetrics("A9!mediaForge#2026");
    expect(strong.entropy).toBeGreaterThan(weak.entropy);
    expect(strong.hasSymbol).toBe(true);
  });

  it("generates requested password lengths", () => {
    expect(generatePassword(32, true)).toHaveLength(32);
    expect(generatePassword(16, false)).toHaveLength(16);
  });

  it("formats theoretical crack time without throwing", () => {
    expect(crackTimeLabel(0, 1e9)).toBe("instantâneo");
    expect(crackTimeLabel(100, 1e9)).toContain("anos");
  });

  it("creates a valid ZIP container with central directory", async () => {
    const zip = new JSZip();
    zip.file("hello.txt", "MediaForge");
    zip.file("folder/readme.txt", "ok");
    const blob = await zip.generateAsync({ type: "blob" });
    const bytes = await blobBytes(blob);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("hello.txt");
    expect(text).toContain("folder/readme.txt");
  });
});
