import { cn, formatCurrency } from "@/lib/utils";
import { adminCardClassName } from "./adminClasses";

export interface RevenueMonth {
  /** Rótulo curto do mês ("Out"). */
  label: string;
  value: number;
}

interface RevenueChartProps {
  /** Meses em ordem cronológica; o último fica em destaque. */
  months: RevenueMonth[];
}

/** Altura da barra do maior mês, como no protótipo (115px). */
const MAX_BAR_HEIGHT = 115;
/** Altura mínima, para um mês sem receita continuar visível. */
const MIN_BAR_HEIGHT = 4;

/** "Evolução da receita" do Figma (750:26): barras mensais com o mês atual na cor da marca. */
export default function RevenueChart({ months }: RevenueChartProps) {
  const max = Math.max(...months.map((month) => month.value), 0);

  return (
    <section className={cn(adminCardClassName, "flex flex-col gap-4 p-6")} aria-label="Evolução da receita">
      <h2 className="text-xl leading-7 font-semibold text-[var(--foreground)]">Evolução da receita</h2>
      <p className="text-xs leading-[18px] text-[var(--foreground-secondary)]">Pedidos não cancelados</p>
      <ol className="flex items-end gap-2 md:gap-3">
        {months.map((month, index) => {
          const height = max > 0 ? Math.max(MIN_BAR_HEIGHT, (month.value / max) * MAX_BAR_HEIGHT) : MIN_BAR_HEIGHT;
          const isCurrent = index === months.length - 1;
          return (
            <li key={month.label} className="flex min-w-0 flex-1 flex-col gap-2">
              <div
                data-testid="revenue-bar"
                className={isCurrent ? "bg-[var(--color-brand)]" : "bg-[var(--color-bg-chart-muted)]"}
                style={{ height }}
                title={`${month.label}: ${formatCurrency(month.value)}`}
              />
              <span className="text-xs leading-4 font-medium tracking-[0.5px] text-[var(--foreground-muted)]">
                {month.label}
                <span className="sr-only">: {formatCurrency(month.value)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
