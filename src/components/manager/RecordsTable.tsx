import { useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { adminButtonClassName, adminCardClassName } from "./adminClasses";

export interface RecordColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Primeira informação da linha: texto principal em vez de secundário. */
  primary?: boolean;
  /** No card mobile, mostra só o conteúdo (ex.: botão de ação), sem "Rótulo:". */
  hideMobileLabel?: boolean;
}

interface RecordsTableProps<T> {
  title: string;
  columns: RecordColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  pageSize?: number;
}

/**
 * "Registros" do Figma (750:55): tabela com cabeçalho cinza, linhas com borda,
 * contagem e paginação Anterior/Próxima. No mobile (755:1082) cada linha vira um
 * card com "Rótulo: valor", na mesma marcação da tabela.
 */
export default function RecordsTable<T>({ title, columns, rows, getRowKey, pageSize = 10 }: RecordsTableProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visibleRows = rows.slice(start, start + pageSize);

  return (
    <section className={cn(adminCardClassName, "flex flex-col p-4")} aria-label={title}>
      <h2 className="text-xl leading-7 font-semibold text-[var(--foreground)]">{title}</h2>
      <table className="block w-full border-collapse text-left text-xs md:table md:table-fixed">
        <thead className="hidden bg-[var(--background-store)] md:table-header-group">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="p-3 leading-4 font-medium tracking-[0.5px] text-[var(--foreground-secondary)]"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {visibleRows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="flex flex-col gap-2 border-b border-[var(--border)] py-3 md:table-row md:py-0"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "align-top leading-[18px] break-words md:p-3",
                    column.primary ? "text-[var(--foreground)]" : "text-[var(--foreground-secondary)]",
                  )}
                >
                  {!column.hideMobileLabel && <span className="md:hidden">{column.header}: </span>}
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="pt-3 text-xs leading-[18px] text-[var(--foreground-muted)]" aria-live="polite">
        {rows.length === visibleRows.length
          ? `Exibindo ${rows.length} ${rows.length === 1 ? "registro" : "registros"}`
          : `Exibindo ${start + 1}–${start + visibleRows.length} de ${rows.length} registros`}
      </p>
      <nav className="flex gap-3 p-3 max-md:px-0" aria-label={`Paginação de ${title.toLocaleLowerCase("pt-BR")}`}>
        <Button
          variant="outline-neutral"
          size="sm"
          className={cn(adminButtonClassName, "disabled:opacity-40 max-md:min-w-0 max-md:flex-1")}
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
        >
          Anterior
        </Button>
        <Button
          variant="outline-neutral"
          size="sm"
          className={cn(adminButtonClassName, "disabled:opacity-40 max-md:min-w-0 max-md:flex-1")}
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
        >
          Próxima
        </Button>
      </nav>
    </section>
  );
}
