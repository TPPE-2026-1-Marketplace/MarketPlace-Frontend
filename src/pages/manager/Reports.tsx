import { useMemo, useState } from "react";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import FilterBar from "@/components/manager/FilterBar";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import ReportsInfoDialog from "@/components/manager/ReportsInfoDialog";
import RevenueChart from "@/components/manager/RevenueChart";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import { formatKpiCount } from "@/components/manager/format";
import Button from "@/components/ui/Button";
import {
  OVERVIEW_PERIOD_LABELS,
  ordersInPeriod,
  revenueByMonth,
  summarizeOrders,
  type OverviewPeriod,
} from "@/hooks/useAdminOverview";
import { useManagementOrders } from "@/hooks/useManagementOrders";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/lib/catalog";
import type { ApiOrder } from "@/lib/management";
import { formatCurrency } from "@/lib/utils";

interface TopVariant {
  sku: string;
  quantity: number;
}

// O protótipo abre em "Período: últimos 6 meses", o mesmo recorte do gráfico.
const DEFAULT_PERIOD: OverviewPeriod = "6m";

/** Quantidade vendida por SKU da variante nos pedidos não cancelados, da maior para a menor. */
function rankVariants(orders: ApiOrder[]): TopVariant[] {
  const totals = new Map<string, number>();
  orders
    .filter((order) => order.status !== "cancelled")
    .flatMap((order) => order.items)
    .forEach((item) => totals.set(item.idVariante, (totals.get(item.idVariante) ?? 0) + item.quantidade));
  return [...totals.entries()]
    .map(([sku, quantity]) => ({ sku, quantity }))
    .sort((a, b) => b.quantity - a.quantity || a.sku.localeCompare(b.sku));
}

/** "Princesa Rosé · Rosa / M", como no protótipo, a partir do catálogo. */
function variantNames(products: Product[]): Map<string, string> {
  const names = new Map<string, string>();
  products.forEach((product) =>
    product.variants.forEach((variant) => {
      const label = [variant.cor, variant.tamanho].filter(Boolean).join(" / ");
      names.set(variant.codigoSku, label ? `${product.titulo} · ${label}` : product.titulo);
    }),
  );
  return names;
}

interface ReportsProps {
  /** Data de referência dos períodos; os testes fixam. */
  now?: Date;
}

/** Relatórios do painel (Figma 755:1737 / 755:1937). */
export function Reports({ now }: ReportsProps) {
  const { orders, isLoading, error, refetch } = useManagementOrders();
  // O catálogo só dá nome às variantes: se falhar, a tabela continua com o SKU.
  const { products } = useProducts({ page: 1, limit: 100 });
  const [draftPeriod, setDraftPeriod] = useState<OverviewPeriod>(DEFAULT_PERIOD);
  const [period, setPeriod] = useState<OverviewPeriod>(DEFAULT_PERIOD);
  const [infoOpen, setInfoOpen] = useState(false);
  const [openedAt] = useState(() => new Date());
  const reference = now ?? openedAt;
  const referenceTime = reference.getTime();

  const { summary, months, ranking } = useMemo(() => {
    const at = new Date(referenceTime);
    const periodOrders = ordersInPeriod(orders, period, at);
    return {
      summary: summarizeOrders(periodOrders),
      months: revenueByMonth(orders, at),
      ranking: rankVariants(periodOrders),
    };
  }, [orders, period, referenceTime]);
  const names = useMemo(() => variantNames(products), [products]);

  const columns: RecordColumn<TopVariant>[] = [
    { key: "sku", header: "SKU da variante", primary: true, render: (row) => row.sku },
    { key: "produto", header: "Produto", render: (row) => names.get(row.sku) ?? "Fora do catálogo atual" },
    { key: "quantidade", header: "Quantidade", render: (row) => row.quantity },
  ];

  const resetPeriod = () => {
    setDraftPeriod(DEFAULT_PERIOD);
    setPeriod(DEFAULT_PERIOD);
  };

  return (
    <>
      <AdminPageHeader
        title="Relatórios"
        description="Analise receita, pedidos válidos e os SKUs com maior saída."
        action={
          <Button variant="action" size="sm" className={adminButtonClassName} onClick={() => setInfoOpen(true)}>
            Detalhar indicadores
          </Button>
        }
      />

      {isLoading && orders.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <KpiGrid columns={3}>
            <KpiCard label="Receita" value={formatCurrency(summary.revenue)} help="No período selecionado" />
            <KpiCard
              label="Pedidos válidos"
              value={formatKpiCount(summary.validOrders)}
              help="No período selecionado"
            />
            <KpiCard label="Ticket médio" value={formatCurrency(summary.averageTicket)} help="No período selecionado" />
          </KpiGrid>

          <RevenueChart months={months} />

          <FilterBar onApply={() => setPeriod(draftPeriod)}>
            <AdminField
              label={`Período: ${OVERVIEW_PERIOD_LABELS[draftPeriod].toLocaleLowerCase("pt-BR")}`}
              htmlFor="reports-period"
            >
              <select
                id="reports-period"
                value={draftPeriod}
                onChange={(event) => setDraftPeriod(event.target.value as OverviewPeriod)}
                className={adminControlClassName}
              >
                {(Object.keys(OVERVIEW_PERIOD_LABELS) as OverviewPeriod[]).map((value) => (
                  <option key={value} value={value}>
                    {OVERVIEW_PERIOD_LABELS[value]}
                  </option>
                ))}
              </select>
            </AdminField>
          </FilterBar>

          {ranking.length === 0 ? (
            <NoResults onClear={resetPeriod} />
          ) : (
            <RecordsTable
              key={period}
              title="Produtos mais vendidos"
              columns={columns}
              rows={ranking}
              getRowKey={(row) => row.sku}
            />
          )}
        </>
      )}

      <AccessNotice />

      <ReportsInfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}
