/** Contagens dos indicadores com dois dígitos, como no protótipo ("08", "05"). */
export function formatKpiCount(value: number): string {
  return String(value).padStart(2, "0");
}

/** Competência das comissões: "Outubro / 2026", como no protótipo. */
export function formatCompetence(mes: number, ano: number): string {
  const month = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} / ${ano}`;
}

/** Percentual com vírgula e até uma casa: 0.015 → "1,5". */
export function formatPercentInput(rate: number): string {
  return (rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2, useGrouping: false });
}

/** Lê "1,5" ou "1.5" digitado em um campo de percentual e devolve a taxa (0.015). */
export function parsePercentInput(value: string): number {
  return Number(value.replace(",", ".")) / 100;
}

/** Data curta das listagens: "26 out", como no protótipo. */
export function formatShortDate(value: string): string {
  return new Date(value)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "")
    .replace(" de ", " ");
}
