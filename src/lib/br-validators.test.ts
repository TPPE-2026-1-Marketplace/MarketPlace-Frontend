import { describe, expect, it } from "vitest";
import { formatCpf, formatPhone, isValidCpf, isValidPhone, onlyDigits } from "./br-validators";

describe("onlyDigits", () => {
  it("remove tudo que não é número e tolera null/undefined", () => {
    expect(onlyDigits("(61) 99999-0000")).toBe("61999990000");
    expect(onlyDigits(null)).toBe("");
    expect(onlyDigits(undefined)).toBe("");
  });
});

describe("formatCpf", () => {
  it("aplica a máscara progressivamente", () => {
    expect(formatCpf("529")).toBe("529");
    expect(formatCpf("5299")).toBe("529.9");
    expect(formatCpf("5299822")).toBe("529.982.2");
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  it("ignora letras e corta o excesso de dígitos", () => {
    expect(formatCpf("abc")).toBe("");
    expect(formatCpf("529.982.247-25999")).toBe("529.982.247-25");
  });
});

describe("isValidCpf", () => {
  it("aceita CPFs válidos, com ou sem máscara", () => {
    expect(isValidCpf("52998224725")).toBe(true);
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("11144477735")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(isValidCpf("12345678900")).toBe(false);
    expect(isValidCpf("52998224724")).toBe(false);
  });

  it("rejeita sequências repetidas, tamanho errado e vazio", () => {
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
    expect(isValidCpf("5299822472")).toBe(false);
    expect(isValidCpf("529982247250")).toBe(false);
    expect(isValidCpf("")).toBe(false);
    expect(isValidCpf(null)).toBe(false);
  });
});

describe("formatPhone", () => {
  it("aplica a máscara de celular (11 dígitos)", () => {
    expect(formatPhone("6")).toBe("(6");
    expect(formatPhone("61")).toBe("(61");
    expect(formatPhone("619")).toBe("(61) 9");
    expect(formatPhone("61999990000")).toBe("(61) 99999-0000");
  });

  it("aplica a máscara de fixo (10 dígitos)", () => {
    expect(formatPhone("6133334444")).toBe("(61) 3333-4444");
  });

  it("devolve vazio quando não há dígitos e corta o excesso", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("()")).toBe("");
    expect(formatPhone("619999900001234")).toBe("(61) 99999-0000");
  });
});

describe("isValidPhone", () => {
  it("aceita celular e fixo válidos, com ou sem máscara", () => {
    expect(isValidPhone("61999990000")).toBe(true);
    expect(isValidPhone("(61) 99999-0000")).toBe(true);
    expect(isValidPhone("6133334444")).toBe(true);
  });

  it("rejeita DDD inexistente", () => {
    expect(isValidPhone("00999990000")).toBe(false);
    expect(isValidPhone("10999990000")).toBe(false);
    expect(isValidPhone("20333344445")).toBe(false);
  });

  it("rejeita celular sem 9 e fixo começando com 9 ou 0/1", () => {
    expect(isValidPhone("61899990000")).toBe(false);
    expect(isValidPhone("6193334444")).toBe(false);
    expect(isValidPhone("6103334444")).toBe(false);
  });

  it("rejeita tamanho errado e vazio", () => {
    expect(isValidPhone("619999900")).toBe(false);
    expect(isValidPhone("619999900001")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});
