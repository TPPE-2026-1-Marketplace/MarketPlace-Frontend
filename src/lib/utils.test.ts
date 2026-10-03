import { describe, expect, it } from "vitest";
import { cn, formatCurrency, formatDate, truncate } from "./utils";

describe("utils", () => {
  it("cn junta classes e resolve conflitos do Tailwind", () => {
    const hidden = false;
    expect(cn("p-2", hidden && "hidden", "p-4", ["text-sm"])).toBe("p-4 text-sm");
  });

  it("formatCurrency formata em real", () => {
    expect(formatCurrency(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });

  it("formatDate formata no padrão brasileiro", () => {
    expect(formatDate(new Date(2026, 8, 5))).toBe("05/09/2026");
    expect(formatDate("2026-12-25T12:00:00")).toBe("25/12/2026");
  });

  it("truncate corta textos longos com reticências", () => {
    expect(truncate("DK Fashion", 20)).toBe("DK Fashion");
    expect(truncate("DK Fashion", 2)).toBe("DK…");
  });
});
