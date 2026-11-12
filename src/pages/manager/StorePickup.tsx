import { useMemo, useRef, useState } from "react";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import AdminPanel from "@/components/manager/AdminPanel";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import FilterBar from "@/components/manager/FilterBar";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import StorePickupDialog from "@/components/manager/StorePickupDialog";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import { formatKpiCount } from "@/components/manager/format";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useStorePickup } from "@/hooks/useStorePickup";
import {
  orderCustomerEmail,
  orderCustomerName,
  type ApiOrder,
} from "@/lib/management";
import { formatCurrency } from "@/lib/utils";

interface StorePickupProps {
  now?: Date;
}

function getOrderItemsCount(order: ApiOrder): number {
  if (!order.items || order.items.length === 0) return 0;
  return order.items.reduce((sum, item) => sum + item.quantidade, 0);
}

function getPickupSituation(status: string): string {
  switch (status) {
    case "paid":
    case "shipped":
      return "Pronto para retirar";
    case "pending":
      return "Pagamento pendente";
    case "delivered":
      return "Retirado";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
}

/** Tela de Retirada em loja do painel administrativo (Figma 755:4709 / 755:4915). */
export function StorePickup({ now }: StorePickupProps) {
  const { isInternalUser } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    orders,
    peopleMap,
    waitingCount,
    pickedUpTodayCount,
    isLoading,
    error,
    refetch,
    sendCode,
    resendCode,
    validateCode,
  } = useStorePickup(isInternalUser, now);

  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return orders;

    return orders.filter((order) => {
      const orderNumber = String(order.idPedido);
      const cleanTerm = term.replace("#", "");
      const customerName = orderCustomerName(order).toLocaleLowerCase("pt-BR");
      const customerEmail = (orderCustomerEmail(order, peopleMap) ?? "").toLocaleLowerCase("pt-BR");

      return (
        orderNumber.includes(cleanTerm) ||
        customerName.includes(term) ||
        customerEmail.includes(term)
      );
    });
  }, [orders, search, peopleMap]);

  if (!isInternalUser) {
    return (
      <AdminPanel title="Acesso restrito">
        <AdminField
          label="Retirada em loja"
          value="Apenas funcionários autorizados podem gerenciar retiradas em loja."
        />
      </AdminPanel>
    );
  }

  const clearFilters = () => {
    setDraftSearch("");
    setSearch("");
  };

  const handleSearchFocus = () => {
    searchInputRef.current?.focus();
  };

  const columns: RecordColumn<ApiOrder>[] = [
    {
      key: "pedido",
      header: "Pedido",
      primary: true,
      render: (order) => `#${order.idPedido}`,
    },
    {
      key: "cliente",
      header: "Cliente",
      render: (order) => orderCustomerName(order),
    },
    {
      key: "itens",
      header: "Itens",
      render: (order) => String(getOrderItemsCount(order)),
    },
    {
      key: "total",
      header: "Total",
      render: (order) => formatCurrency(Number(order.valorTotal)),
    },
    {
      key: "situacao",
      header: "Situação",
      render: (order) => getPickupSituation(order.status),
    },
    {
      key: "acao",
      header: "Ação",
      hideMobileLabel: true,
      render: (order) => {
        const canPickup = order.status !== "delivered" && order.status !== "cancelled";

        return (
          <Button
            variant="outline-neutral"
            size="sm"
            className={`${adminButtonClassName} min-w-[136px] whitespace-nowrap`}
            onClick={() => setSelectedOrder(order)}
            disabled={!canPickup}
            aria-label={
              canPickup
                ? `Iniciar retirada do pedido #${order.idPedido}`
                : `Pedido #${order.idPedido} retirado`
            }
          >
            {canPickup ? "Iniciar retirada" : "Retirado"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Retirada em loja"
        description="Confira o pedido e valide o código antes de liberar os produtos."
        action={
          <Button
            variant="action"
            size="sm"
            className={adminButtonClassName}
            onClick={handleSearchFocus}
          >
            Buscar retirada
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <KpiGrid>
            <KpiCard
              label="Aguardando retirada"
              value={formatKpiCount(waitingCount)}
              help="No período selecionado"
            />
            <KpiCard
              label="Retirados hoje"
              value={formatKpiCount(pickedUpTodayCount)}
              help="No período selecionado"
            />
          </KpiGrid>

          <FilterBar onApply={() => setSearch(draftSearch)}>
            <AdminField label="Buscar pedido, nome ou e-mail" htmlFor="pickup-search">
              <input
                id="pickup-search"
                ref={searchInputRef}
                type="search"
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                placeholder="Buscar pedido, nome ou e-mail..."
                className={adminControlClassName}
              />
            </AdminField>
          </FilterBar>

          {filteredOrders.length === 0 ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <RecordsTable
              key={search}
              title="Registros recentes"
              columns={columns}
              rows={filteredOrders}
              getRowKey={(order) => String(order.idPedido)}
            />
          )}
        </>
      )}

      <AccessNotice />

      <StorePickupDialog
        open={selectedOrder !== null}
        order={selectedOrder}
        customerEmail={
          selectedOrder ? orderCustomerEmail(selectedOrder, peopleMap) : null
        }
        onClose={() => setSelectedOrder(null)}
        onSendCode={sendCode}
        onResendCode={resendCode}
        onValidateCode={validateCode}
      />
    </div>
  );
}
