import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminDialog from "@/components/manager/AdminDialog";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import FilterBar from "@/components/manager/FilterBar";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import RevenueChart from "@/components/manager/RevenueChart";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import { formatKpiCount } from "@/components/manager/format";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { OVERVIEW_PERIOD_LABELS, useAdminOverview, type OverviewPeriod } from "@/hooks/useAdminOverview";
import { ORDER_STATUS_LABELS, PICKUP_TYPE_LABELS, orderCustomerName, type ApiOrder } from "@/lib/management";
import { formatCurrency } from "@/lib/utils";

const DEFAULT_PERIOD: OverviewPeriod = "month";

const columns: RecordColumn<ApiOrder>[] = [
  { key: "pedido", header: "Pedido", primary: true, render: (order) => `#${order.idPedido}` },
  { key: "cliente", header: "Cliente", render: orderCustomerName },
  { key: "modalidade", header: "Modalidade", render: (order) => PICKUP_TYPE_LABELS[order.tipoRetirada] },
  { key: "total", header: "Total", render: (order) => formatCurrency(Number(order.valorTotal)) },
  { key: "status", header: "Status", render: (order) => ORDER_STATUS_LABELS[order.status] },
];

interface OverviewProps {
  /** Data de referência dos períodos; fixada nos testes. */
  now?: Date;
}

/** Visão geral do painel (Figma 755:3 / 755:225). */
export function Overview({ now }: OverviewProps) {
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const [draftPeriod, setDraftPeriod] = useState<OverviewPeriod>(DEFAULT_PERIOD);
  const [period, setPeriod] = useState<OverviewPeriod>(DEFAULT_PERIOD);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const { summary, stock, months, recentOrders, isLoading, error, refetch } = useAdminOverview(period, now);

  const clearFilters = () => {
    setDraftPeriod(DEFAULT_PERIOD);
    setPeriod(DEFAULT_PERIOD);
  };

  const periodHelp = OVERVIEW_PERIOD_LABELS[period];

  return (
    <>
      <AdminPageHeader
        title="Visão geral"
        description="Acompanhe a operação e as tarefas que precisam de atenção."
        action={
          <Button variant="action" size="sm" className={adminButtonClassName} onClick={() => setSummaryOpen(true)}>
            Consultar relatórios
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <KpiGrid>
            <KpiCard label="Receita total" value={formatCurrency(summary.revenue)} help={periodHelp} />
            <KpiCard label="Pedidos pendentes" value={formatKpiCount(summary.pendingOrders)} help={periodHelp} />
            <KpiCard label="Estoque online" value={formatKpiCount(stock.online)} help="Unidades disponíveis" />
            <KpiCard label="Estoque loja" value={formatKpiCount(stock.physical)} help="Unidades disponíveis" />
          </KpiGrid>

          <RevenueChart months={months} />

          <FilterBar onApply={() => setPeriod(draftPeriod)}>
            <AdminField label={`Período: ${OVERVIEW_PERIOD_LABELS[draftPeriod].toLocaleLowerCase("pt-BR")}`} htmlFor="overview-period">
              <select
                id="overview-period"
                value={draftPeriod}
                onChange={(event) => setDraftPeriod(event.target.value as OverviewPeriod)}
                className={adminControlClassName}
              >
                {Object.entries(OVERVIEW_PERIOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </AdminField>
          </FilterBar>

          {recentOrders.length === 0 ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <RecordsTable
              key={period}
              title="Registros recentes"
              columns={columns}
              rows={recentOrders}
              getRowKey={(order) => order.idPedido}
              pageSize={5}
            />
          )}
        </>
      )}

      <AccessNotice />

      <AdminDialog
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Resumo de desempenho"
        description={`Indicadores do período: ${OVERVIEW_PERIOD_LABELS[period].toLocaleLowerCase("pt-BR")}.`}
        actions={
          <>
            {isManager && (
              <Button
                variant="action"
                size="sm"
                className={adminButtonClassName}
                onClick={() => navigate("/painel/relatorios")}
              >
                Ver relatórios
              </Button>
            )}
            <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={() => setSummaryOpen(false)}>
              Cancelar
            </Button>
          </>
        }
      >
        <AdminField label="Receita" value={formatCurrency(summary.revenue)} />
        <AdminField label="Pedidos válidos" value={formatKpiCount(summary.validOrders)} />
        <AdminField label="Ticket médio" value={formatCurrency(summary.averageTicket)} />
      </AdminDialog>
    </>
  );
}
