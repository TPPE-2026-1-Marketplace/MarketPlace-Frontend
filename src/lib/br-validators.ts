/**
 * Validação de CPF e telefone (Brasil).
 *
 * Máscaras e `onlyDigits` já existem em `./utils` (maskCpf, maskPhone, onlyDigits);
 * aqui ficam só as regras de validade. Elas dão feedback rápido ao usuário — a fonte
 * da verdade é o backend, que aplica as mesmas regras.
 */
import { onlyDigits } from "./utils";

const VALID_DDDS = new Set(
  `11 12 13 14 15 16 17 18 19  21 22 24 27 28  31 32 33 34 35 37 38
   41 42 43 44 45 46 47 48 49  51 53 54 55  61 62 63 64 65 66 67 68 69
   71 73 74 75 77 79  81 82 83 84 85 86 87 88 89  91 92 93 94 95 96 97 98 99`.split(/\s+/),
);

function cpfCheckDigit(digits: string, length: number): number {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += Number(digits[i]) * (length + 1 - i);
  }
  return ((sum * 10) % 11) % 10;
}

/** CPF completo, com dígitos verificadores corretos e sem sequência repetida. */
export function isValidCpf(value: string | null | undefined): boolean {
  const d = onlyDigits(value ?? "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // 111.111.111-11 etc.
  return cpfCheckDigit(d, 9) === Number(d[9]) && cpfCheckDigit(d, 10) === Number(d[10]);
}

/**
 * Telefone brasileiro com DDD:
 * - celular: 11 dígitos, DDD válido e começando com 9 depois do DDD;
 * - fixo: 10 dígitos, DDD válido e primeiro dígito entre 2 e 5.
 */
export function isValidPhone(value: string | null | undefined): boolean {
  const d = onlyDigits(value ?? "");
  if (d.length !== 10 && d.length !== 11) return false;
  if (!VALID_DDDS.has(d.slice(0, 2))) return false;
  return d.length === 11 ? d[2] === "9" : /[2-5]/.test(d[2]);
}

export const CPF_INVALID_MESSAGE = "CPF inválido. Confira os números digitados.";
export const PHONE_INVALID_MESSAGE = "Telefone inválido. Use DDD + número, ex.: (61) 99999-0000.";
