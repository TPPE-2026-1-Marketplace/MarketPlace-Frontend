import { useMemo, useRef, useState } from "react";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import FilterBar from "@/components/manager/FilterBar";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import OrderDetailDialog from "@/components/manager/OrderDetailDialog";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import { formatKpiCount } from "@/components/manager/format";
import Button from "@/components/ui/Button";
import { useManagementOrders } from "@/hooks/useManagementOrders";
import {
  ORDER_STATUS_LABELS,
  PICKUP_TYPE_LABELS,
  orderCustomerCpf,
  orderCustomerName,
  type ApiOrder,
  type ApiOrderStatus,
  type ApiPickupType,
} from "@/lib/management";
import { formatCurrency, obscureCpf, onlyDigits } from "@/lib/utils";

interface OrderFilters {
  search: string;
  status: "all" | ApiOrderStatus;
  pickupType: "all" | ApiPickupType;
}

const EMPTY_FILTERS: OrderFilters = { search: "", status: "all", pickupType: "all" };

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

function customerCell(order: ApiOrder) {
  const cpf = orderCustomerCpf(order);
  return cpf ? `${orderCustomerName(order)} · ${obscureCpf(cpf)}` : orderCustomerName(order);
}

function matchesFilters(order: ApiOrder, { search, status, pickupType }: OrderFilters) {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const digits = onlyDigits(term);
  const matchesSearch =
    !term ||
    String(order.idPedido).includes(term.replace("#", "")) ||
    orderCustomerName(order).toLocaleLowerCase("pt-BR").includes(term) ||
    (digits.length > 0 && onlyDigits(orderCustomerCpf(order) ?? "").includes(digits)) ||
    order.items.some((item) => item.idVariante.toLocaleLowerCase("pt-BR").includes(term));
  return (
    matchesSearch &&
    (status === "all" || order.status === status) &&
    (pickupType === "all" || order.tipoRetirada === pickupType)
  );
}

interface OrdersProps {
  /** Perfis sem permissão veem os pedidos, mas não alteram status nem rastreio. */
  readOnly?: boolean;
}

/** Pedidos do painel (Figma 755:831 / 755:1082). */
export function Orders({ readOnly = false }: OrdersProps) {
  const { orders, isLoading, error, refetch, updateStatus, updateTracking } = useManagementOrders();
  const [draft, setDraft] = useState<OrderFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<OrderFilters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => matchesFilters(order, filters))
        .sort((a, b) => new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime()),
    [orders, filters],
  );
  const selectedOrder = orders.find((order) => order.idPedido === selectedId) ?? null;
  const counts = useMemo(
    () => ({
      pending: orders.filter((order) => order.status === "pending").length,
      paid: orders.filter((order) => order.status === "paid").length,
      shipped: orders.filter((order) => order.status === "shipped").length,
      pickup: orders.filter(
        (order) => order.tipoRetirada === "loja" && order.status !== "delivered" && order.status !== "cancelled",
      ).length,
    }),
    [orders],
  );

  const columns: RecordColumn<ApiOrder>[] = [
    { key: "pedido", header: "Pedido", primary: true, render: (order) => `#${order.idPedido}` },
    { key: "cliente", header: "Cliente / CPF", render: customerCell },
    { key: "data", header: "Data", render: (order) => shortDate(order.dataPedido) },
    { key: "modalidade", header: "Modalidade", render: (order) => PICKUP_TYPE_LABELS[order.tipoRetirada] },
    { key: "total", header: "Total", render: (order) => formatCurrency(Number(order.valorTotal)) },
    { key: "status", header: "Status", render: (order) => ORDER_STATUS_LABELS[order.status] },
    {
      key: "acao",
      header: "Ação",
      hideMobileLabel: true,
      render: (order) => (
        <Button
          variant="outline-neutral"
          size="sm"
          className={`${adminButtonClassName} min-w-[128px]`}
          onClick={() => setSelectedId(order.idPedido)}
          aria-label={`Ver pedido #${order.idPedido}`}
        >
          Ver pedido
        </Button>
      ),
    },
  ];

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  return (
    <>
      <AdminPageHeader
        title="Pedidos"
        description="Acompanhe o pedido do pagamento até a entrega ou retirada."
        action={
          <Button variant="action" size="sm" className={adminButtonClassName} onClick={() => searchRef.current?.focus()}>
            Buscar pedido
          </Button>
        }
      />

      {isLoading && orders.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <KpiGrid>
            <KpiCard label="Pendentes" value={formatKpiCount(counts.pending)} help="Aguardando pagamento" />
            <KpiCard label="Em separação" value={formatKpiCount(counts.paid)} help="Pagos, a preparar" />
            <KpiCard label="Enviados" value={formatKpiCount(counts.shipped)} help="Com código de rastreio" />
            <KpiCard label="Retirada na loja" value={formatKpiCount(counts.pickup)} help="Aguardando retirada" />
          </KpiGrid>

          <FilterBar onApply={() => setFilters(draft)}>
            <AdminField label="Buscar pedido, CPF ou SKU" htmlFor="orders-search">
              <input
                id="orders-search"
                ref={searchRef}
                type="search"
                value={draft.search}
                onChange={(event) => setDraft({ ...draft, search: event.target.value })}
                placeholder="Ex.: 1048, 123.456.789-00 ou DK-009"
                className={adminControlClassName}
              />
            </AdminField>
            <AdminField
              label={`Status: ${draft.status === "all" ? "todos" : ORDER_STATUS_LABELS[draft.status].toLocaleLowerCase("pt-BR")}`}
              htmlFor="orders-status"
            >
              <select
                id="orders-status"
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as OrderFilters["status"] })}
                className={adminControlClassName}
              >
                <option value="all">Todos</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField
              label={`Modalidade: ${draft.pickupType === "all" ? "todas" : PICKUP_TYPE_LABELS[draft.pickupType].toLocaleLowerCase("pt-BR")}`}
              htmlFor="orders-pickup"
            >
              <select
                id="orders-pickup"
                value={draft.pickupType}
                onChange={(event) =>
                  setDraft({ ...draft, pickupType: event.target.value as OrderFilters["pickupType"] })
                }
                className={adminControlClassName}
              >
                <option value="all">Todas</option>
                {Object.entries(PICKUP_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </AdminField>
          </FilterBar>

          {filteredOrders.length === 0 ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <RecordsTable
              key={JSON.stringify(filters)}
              title="Registros recentes"
              columns={columns}
              rows={filteredOrders}
              getRowKey={(order) => order.idPedido}
            />
          )}
        </>
      )}

      <AccessNotice />

      <OrderDetailDialog
        order={selectedOrder}
        readOnly={readOnly}
        onClose={() => setSelectedId(null)}
        onUpdateStatus={updateStatus}
        onUpdateTracking={updateTracking}
      />
    </>
  );
}
