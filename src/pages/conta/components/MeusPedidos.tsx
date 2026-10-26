import { Package } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/card";
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
    <Card className="gap-5 rounded-none border-[var(--border)] p-6">
      <h2 className="font-serif text-xl text-gray-900">Meus Pedidos</h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-none" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<Package className="size-7" />} title="Você ainda não tem pedidos." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.idPedido}
              className="flex items-center justify-between border border-gray-100 p-4"
            >
              <div>
                <p className="text-sm text-gray-900">Pedido #{order.idPedido}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatDate(order.dataPedido)} · {formatItemCount(order.itemCount)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                <span className="text-sm text-gray-900">{formatCurrency(order.valorTotal)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
