import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx for conditional classnames.
 * Handles conflicts (e.g. `p-4` vs `p-2`) via tailwind-merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as BRL currency.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Format a date string to pt-BR locale.
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Truncate a string to a max length, adding ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

/**
 * Strip everything but digits. Use before sending a masked field to a API
 * (o backend espera cpf/telefone/cep sem máscara).
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Aplica a máscara de telefone brasileiro progressivamente enquanto o
 * usuário digita: (00) 0000-0000 (fixo, 10 dígitos) ou (00) 00000-0000
 * (celular, 11 dígitos). Aceita colar o número com ou sem formatação.
 */
export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length > 10) {
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
  }
  if (digits.length > 6) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  if (digits.length > 2) {
    return digits.replace(/(\d{2})(\d{0,4})/, "($1) $2").trim();
  }
  if (digits.length > 0) {
    return `(${digits}`;
  }
  return "";
}

/**
 * Aplica a máscara de CPF progressivamente: 000.000.000-00.
 */
export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length > 9) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
  }
  if (digits.length > 6) {
    return digits.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
  }
  if (digits.length > 3) {
    return digits.replace(/(\d{3})(\d{0,3})/, "$1.$2");
  }
  return digits;
}

/**
 * Aplica a máscara de CEP progressivamente: 00000-000.
 */
export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length > 5) {
    return digits.replace(/(\d{5})(\d{0,3})/, "$1-$2");
  }
  return digits;
}
