import { describe, expect, it } from "vitest";
import { cn, formatCurrency, formatDate, formatItemCount, maskCep, maskCpf, maskPhone, onlyDigits, truncate } from "./utils";

describe("onlyDigits", () => {
  it("remove tudo que não é dígito", () => {
    expect(onlyDigits("(61) 99999-0000")).toBe("61999990000");
    expect(onlyDigits("abc")).toBe("");
  });
});

describe("maskCep", () => {
  it.each([
    ["7", "7"],
    ["70000", "70000"],
    ["700001", "70000-1"],
    ["70000000", "70000-000"],
    ["70000-0001234", "70000-000"],
  ])("formata %s como %s", (input, expected) => {
    expect(maskCep(input)).toBe(expected);
  });
});

describe("maskCpf", () => {
  it.each([
    ["111", "111"],
    ["1114", "111.4"],
    ["1114447", "111.444.7"],
    ["1114447773", "111.444.777-3"],
    ["11144477735", "111.444.777-35"],
    ["111.444.777-3599", "111.444.777-35"],
  ])("formata %s como %s", (input, expected) => {
    expect(maskCpf(input)).toBe(expected);
  });
});

describe("maskPhone", () => {
  it.each([
    ["", ""],
    ["6", "(6"],
    ["619", "(61) 9"],
    ["6133334444", "(61) 3333-4444"],
    ["61999990000", "(61) 99999-0000"],
    ["619999900001", "(61) 99999-0000"],
  ])("formata %s como %s", (input, expected) => {
    expect(maskPhone(input)).toBe(expected);
  });
});

describe("formatItemCount", () => {
  it("usa singular e plural", () => {
    expect(formatItemCount(1)).toBe("1 item");
    expect(formatItemCount(0)).toBe("0 itens");
    expect(formatItemCount(3)).toBe("3 itens");
  });
});

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
