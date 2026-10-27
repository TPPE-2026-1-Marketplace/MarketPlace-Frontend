import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fetchManagementOrders, type ApiOrder, type ApiOrderStatus } from "@/lib/management";

interface UseManagementOrdersResult {
  orders: ApiOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateStatus: (orderId: number, status: ApiOrderStatus) => Promise<void>;
  updateTracking: (orderId: number, trackingCode: string) => Promise<void>;
}

/** Pedidos da gestão (GET /orders) e as alterações de status e rastreio. */
export function useManagementOrders(): UseManagementOrdersResult {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetchManagementOrders()
        .then((response) => setOrders(response.data))
        .catch((loadError) => {
          console.error("Erro ao carregar pedidos da gestão", loadError);
          setError("Não foi possível carregar os pedidos.");
        })
        .finally(() => setIsLoading(false)),
    [],
  );

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  // As alterações propagam o erro para o dialog mostrar a falha sem fechar.
  const updateStatus = useCallback(async (orderId: number, status: ApiOrderStatus) => {
    await api.patch(`/orders/${orderId}/status`, { status });
    setOrders((current) => current.map((order) => (order.idPedido === orderId ? { ...order, status } : order)));
  }, []);

  const updateTracking = useCallback(async (orderId: number, trackingCode: string) => {
    const codigoRastreamento = trackingCode.trim();
    await api.patch(`/orders/${orderId}/tracking`, { codigo_rastreamento: codigoRastreamento });
    // O backend marca o pedido como enviado ao receber o código de rastreio.
    setOrders((current) =>
      current.map((order) =>
        order.idPedido === orderId ? { ...order, codigoRastreamento, status: "shipped" } : order,
      ),
    );
  }, []);

  return { orders, isLoading, error, refetch, updateStatus, updateTracking };
}
