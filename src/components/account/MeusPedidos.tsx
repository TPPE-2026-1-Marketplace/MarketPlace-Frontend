import { Package } from "lucide-react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders, type OrderStatus } from "@/hooks/useOrders";
import { formatCurrency, formatDate, formatItemCount } from "@/lib/utils";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_VARIANT: Record<OrderStatus, "default" | "brand" | "success" | "warning" | "error"> = {
  pending: "warning",
  paid: "brand",
  shipped: "default",
  delivered: "success",
  cancelled: "error",
};

export default function MeusPedidos() {
  const { orders, isLoading } = useOrders();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Meus pedidos</h2>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">Acompanhe o andamento das suas compras.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<Package className="size-7" />} title="Você ainda não tem pedidos." />
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.idPedido}
              className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Pedido #DK{String(order.idPedido).padStart(4, "0")}
                </p>
                <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
              </div>
              <p className="text-xs text-[var(--foreground-secondary)]">
                Realizado em {formatDate(order.dataPedido)}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--foreground-secondary)]">{formatItemCount(order.itemCount)}</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(order.valorTotal)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
