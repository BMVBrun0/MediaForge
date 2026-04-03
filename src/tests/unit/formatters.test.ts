import { describe, expect, it } from "vitest";
import { formatBytes, formatDate, formatReduction } from "@/src/lib/utils/formatters";

describe("formatBytes", () => {
  it("formata bytes em KB e MB", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024 * 2)).toBe("2.0 MB");
  });

  it("trata valores inválidos ou zero", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-10)).toBe("0 B");
  });
});

describe("formatReduction", () => {
  it("retorna a porcentagem de redução", () => {
    expect(formatReduction(1000, 500)).toBe("50.0%");
  });

  it("limita valores inválidos", () => {
    expect(formatReduction(0, 500)).toBe("0%");
  });
});

describe("formatDate", () => {
  it("retorna uma string formatada em pt-BR", () => {
    const value = formatDate("2026-04-03T03:27:00.000Z");
    expect(typeof value).toBe("string");
    expect(value.length).toBeGreaterThan(0);
  });
});
