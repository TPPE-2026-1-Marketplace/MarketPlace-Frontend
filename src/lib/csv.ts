import type { ApiPerson } from "@/lib/management";

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

/** CSV da exportação de clientes: nome, e-mail, telefone e CPF, com aspas escapadas. */
export function buildClientsCsv(clients: ApiPerson[]): string {
  const rows = [
    ["nome", "email", "telefone", "cpf"],
    ...clients.map((client) => [client.nome, client.email, client.telefone ?? "", client.cpf]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

/** Nome do arquivo da exportação, com a data do dia (ex.: clientes_2026-11-07.csv). */
export const clientsCsvFilename = (date = new Date()) => `clientes_${date.toISOString().slice(0, 10)}.csv`;

/** Baixa o conteúdo como arquivo CSV pelo navegador. */
export function downloadCsv(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
