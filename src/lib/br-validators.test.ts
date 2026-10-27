import { describe, expect, it } from "vitest";
import { isValidCpf, isValidPhone } from "./br-validators";

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
