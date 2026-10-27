import { useCallback, useEffect, useState } from "react";
import { api, type PaginatedResponse } from "@/lib/api";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface OrderSummary {
  idPedido: number;
  dataPedido: string;
  status: OrderStatus;
  valorTotal: number;
  itemCount: number;
}

interface OrderItemResponse {
  quantidade?: number;
}

interface OrderResponse {
  idPedido?: number;
  dataPedido?: string;
  status?: OrderStatus;
  valorTotal?: number | string;
  items?: OrderItemResponse[];
}

function parseOrder(raw: OrderResponse): OrderSummary {
  return {
    idPedido: Number(raw.idPedido ?? 0),
    dataPedido: raw.dataPedido ?? new Date().toISOString(),
    status: raw.status ?? "pending",
    valorTotal: Number(raw.valorTotal ?? 0),
    itemCount: raw.items?.reduce((sum, item) => sum + (item.quantidade ?? 0), 0) ?? 0,
  };
}

interface UseOrdersResult {
  orders: OrderSummary[];
  isLoading: boolean;
  error: string | null;
}

/** Pedidos da cliente autenticada (`GET /orders/my`), usado na aba "Meus Pedidos" da conta. */
export function useOrders(): UseOrdersResult {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<PaginatedResponse<OrderResponse>>("/orders/my", {
        page: 1,
        limit: 20,
      });
      setOrders((response.data ?? []).map(parseOrder));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedidos");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error };
}
