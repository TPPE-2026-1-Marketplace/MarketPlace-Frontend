import { useMemo, useRef, useState } from "react";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import FilterBar from "@/components/manager/FilterBar";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import PosSaleDetailDialog from "@/components/manager/PosSaleDetailDialog";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import { formatKpiCount, formatShortDate } from "@/components/manager/format";
import { POS_PAYMENT_NOT_RECORDED, formatPosSaleId, posSellerName } from "@/components/manager/posSales";
import Button from "@/components/ui/Button";
import { useManagementOrders } from "@/hooks/useManagementOrders";
import { orderCustomerCpf, orderCustomerName, type ApiOrder } from "@/lib/management";
import { formatCurrency, obscureCpf, onlyDigits } from "@/lib/utils";

type Period = "all" | "month" | "week" | "today";

const PERIOD_LABELS: Record<Period, string> = {
  month: "Este mês",
  week: "Últimos 7 dias",
  today: "Hoje",
  all: "Todo o período",
};

interface SaleFilters {
  search: string;
  /** CPF do vendedor, ou "all". */
  seller: string;
  period: Period;
}

// O protótipo abre em "Período: este mês"; "Limpar filtros" volta para todo o período.
const INITIAL_FILTERS: SaleFilters = { search: "", seller: "all", period: "month" };
const EMPTY_FILTERS: SaleFilters = { search: "", seller: "all", period: "all" };

const DAY_MS = 24 * 60 * 60 * 1000;

function isInPeriod(value: string, period: Period, now = new Date()) {
  if (period === "all") return true;
  const date = new Date(value);
  if (period === "today") return date.toDateString() === now.toDateString();
  if (period === "week") return now.getTime() - date.getTime() <= 7 * DAY_MS;
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

// Na listagem só o primeiro nome (Figma: "Marina"); sem nome, o CPF mascarado.
function customerCell(sale: ApiOrder) {
  if (sale.user?.nome || sale.clienteNomeAvulso) return orderCustomerName(sale).split(" ")[0];
  const cpf = orderCustomerCpf(sale);
  return cpf ? obscureCpf(cpf) : "Não informado";
}

function matchesFilters(sale: ApiOrder, { search, seller, period }: SaleFilters) {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const digits = onlyDigits(term);
  const matchesSearch =
    !term ||
    formatPosSaleId(sale.idPedido).toLocaleLowerCase("pt-BR").includes(term) ||
    (digits.length > 0 && String(sale.idPedido).includes(digits)) ||
    posSellerName(sale).toLocaleLowerCase("pt-BR").includes(term) ||
    (sale.employee?.codigo_funcionario ?? "").toLocaleLowerCase("pt-BR").includes(term) ||
    orderCustomerName(sale).toLocaleLowerCase("pt-BR").includes(term) ||
    (digits.length > 0 && onlyDigits(orderCustomerCpf(sale) ?? "").includes(digits));
  return (
    matchesSearch && (seller === "all" || sale.idFuncionario === seller) && isInPeriod(sale.dataPedido, period)
  );
}

/** Vendas presenciais do painel (Figma 755:1294 / 755:1535). */
export function POSSales() {
  const { orders, isLoading, error, refetch } = useManagementOrders();
  const [draft, setDraft] = useState<SaleFilters>(INITIAL_FILTERS);
  const [filters, setFilters] = useState<SaleFilters>(INITIAL_FILTERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Só a venda do PDV tem vendedor: o backend preenche idFuncionario apenas em
  // POST /orders/in-store. Pedido online com retirada na loja não entra aqui.
  const sales = useMemo(() => orders.filter((order) => Boolean(order.idFuncionario)), [orders]);
  const sellers = useMemo(() => {
    const byCpf = new Map<string, string>();
    sales.forEach((sale) => byCpf.set(sale.idFuncionario as string, posSellerName(sale)));
    return [...byCpf.entries()].sort(([, a], [, b]) => a.localeCompare(b, "pt-BR"));
  }, [sales]);

  const filteredSales = useMemo(
    () =>
      sales
        .filter((sale) => matchesFilters(sale, filters))
        .sort((a, b) => new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime()),
    [sales, filters],
  );
  // Os indicadores seguem o período selecionado ("No período selecionado").
  const periodSales = useMemo(
    () => sales.filter((sale) => isInPeriod(sale.dataPedido, filters.period)),
    [sales, filters.period],
  );
  const totalSold = periodSales.reduce((sum, sale) => sum + Number(sale.valorTotal), 0);
  const sellersInPeriod = new Set(periodSales.map((sale) => sale.idFuncionario)).size;
  const selectedSale = sales.find((sale) => sale.idPedido === selectedId) ?? null;

  const columns: RecordColumn<ApiOrder>[] = [
    { key: "venda", header: "Venda", primary: true, render: (sale) => formatPosSaleId(sale.idPedido) },
    { key: "data", header: "Data", render: (sale) => formatShortDate(sale.dataPedido) },
    { key: "vendedor", header: "Vendedor", render: posSellerName },
    { key: "cliente", header: "Cliente", render: customerCell },
    { key: "pagamento", header: "Pagamento", render: () => POS_PAYMENT_NOT_RECORDED },
    { key: "total", header: "Total", render: (sale) => formatCurrency(Number(sale.valorTotal)) },
    {
      key: "acao",
      header: "Ação",
      hideMobileLabel: true,
      render: (sale) => (
        <Button
          variant="outline-neutral"
          size="sm"
          className={`${adminButtonClassName} min-w-[128px] whitespace-nowrap`}
          onClick={() => setSelectedId(sale.idPedido)}
          aria-label={`Detalhes da venda ${formatPosSaleId(sale.idPedido)}`}
        >
          Detalhes
        </Button>
      ),
    },
  ];

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  const sellerLabel = draft.seller === "all" ? "todos" : (sellers.find(([cpf]) => cpf === draft.seller)?.[1] ?? "");

  return (
    <>
      <AdminPageHeader
        title="Vendas PDV"
        description="Consulte as vendas presenciais e identifique o vendedor responsável."
        action={
          <Button variant="action" size="sm" className={adminButtonClassName} onClick={() => searchRef.current?.focus()}>
            Consultar venda
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
            <KpiCard
              label="Vendas presenciais"
              value={formatKpiCount(periodSales.length)}
              help="No período selecionado"
            />
            <KpiCard label="Total vendido" value={formatCurrency(totalSold)} help="No período selecionado" />
            <KpiCard label="Vendedores" value={formatKpiCount(sellersInPeriod)} help="No período selecionado" />
          </KpiGrid>

          <FilterBar onApply={() => setFilters(draft)}>
            <AdminField label="Buscar venda, vendedor ou cliente" htmlFor="pos-sales-search">
              <input
                id="pos-sales-search"
                ref={searchRef}
                type="search"
                value={draft.search}
                onChange={(event) => setDraft({ ...draft, search: event.target.value })}
                placeholder="Ex.: PDV-084, Ana ou 123.456.789-00"
                className={adminControlClassName}
              />
            </AdminField>
            <AdminField label={`Vendedor: ${sellerLabel}`} htmlFor="pos-sales-seller">
              <select
                id="pos-sales-seller"
                value={draft.seller}
                onChange={(event) => setDraft({ ...draft, seller: event.target.value })}
                className={adminControlClassName}
              >
                <option value="all">Todos</option>
                {sellers.map(([cpf, name]) => (
                  <option key={cpf} value={cpf}>
                    {name}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField
              label={`Período: ${PERIOD_LABELS[draft.period].toLocaleLowerCase("pt-BR")}`}
              htmlFor="pos-sales-period"
            >
              <select
                id="pos-sales-period"
                value={draft.period}
                onChange={(event) => setDraft({ ...draft, period: event.target.value as Period })}
                className={adminControlClassName}
              >
                {(Object.keys(PERIOD_LABELS) as Period[]).map((value) => (
                  <option key={value} value={value}>
                    {PERIOD_LABELS[value]}
                  </option>
                ))}
              </select>
            </AdminField>
          </FilterBar>

          {filteredSales.length === 0 ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <RecordsTable
              key={JSON.stringify(filters)}
              title="Registros recentes"
              columns={columns}
              rows={filteredSales}
              getRowKey={(sale) => sale.idPedido}
            />
          )}
        </>
      )}

      <AccessNotice />

      <PosSaleDetailDialog sale={selectedSale} onClose={() => setSelectedId(null)} />
    </>
  );
}
