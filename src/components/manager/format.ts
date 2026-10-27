/** Contagens dos indicadores com dois dígitos, como no protótipo ("08", "05"). */
export function formatKpiCount(value: number): string {
  return String(value).padStart(2, "0");
}
