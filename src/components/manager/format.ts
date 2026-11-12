/** Contagens dos indicadores com dois dígitos, como no protótipo ("08", "05"). */
export function formatKpiCount(value: number): string {
  return String(value).padStart(2, "0");
}

/** Data curta das listagens: "26 out", como no protótipo. */
export function formatShortDate(value: string): string {
  return new Date(value)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "")
    .replace(" de ", " ");
}
