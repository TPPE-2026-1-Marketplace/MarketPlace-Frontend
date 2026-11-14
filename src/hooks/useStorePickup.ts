import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  confirmOrderPickup,
  fetchManagementOrders,
  fetchPeople,
  sendOrderPickupCode,
  type ApiOrder,
  type ApiPerson,
} from "@/lib/management";

function isToday(dateStr: string, now: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Mensagem para a equipe quando o envio do código falha. */
function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "Muitos envios seguidos. Aguarde um minuto e tente de novo.";
    if (error.status === 400 || error.status === 503) return error.message;
  }
  return "Não foi possível enviar o código agora. Tente novamente.";
}

/** Hook da camada de apresentação para Retirada em Loja (Issue #175 / Figma 850:5726). */
export function useStorePickup(enabled: boolean, now: Date = new Date()) {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [peopleMap, setPeopleMap] = useState<Map<string, ApiPerson>>(new Map());
  const [sessionDeliveredIds, setSessionDeliveredIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.all([
        fetchManagementOrders(),
        fetchPeople().catch(() => ({ data: [] as ApiPerson[] })),
      ])
        .then(([ordersRes, peopleRes]) => {
          const map = new Map<string, ApiPerson>();
          for (const person of peopleRes.data) {
            map.set(person.cpf, person);
          }
          setPeopleMap(map);

          // Filtra apenas pedidos para retirada na loja física, excluindo vendas do PDV (que possuem idFuncionario)
          const storeOrders = ordersRes.data.filter(
            (order) => order.tipoRetirada === "loja" && !order.idFuncionario,
          );
          setOrders(storeOrders);
          setError(null);
        })
        .catch((err) => {
          console.error("Erro ao carregar pedidos para retirada", err);
          setError("Não foi possível carregar os pedidos de retirada.");
        })
        .finally(() => {
          setIsLoading(false);
        }),
    [],
  );

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await load();
  }, [load]);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  // Indicadores
  const waitingCount = useMemo(() => {
    return orders.filter(
      (order) => order.status !== "delivered" && order.status !== "cancelled",
    ).length;
  }, [orders]);

  const pickedUpTodayCount = useMemo(() => {
    return orders.filter((order) => {
      if (order.status !== "delivered") return false;
      return isToday(order.dataPedido, now) || sessionDeliveredIds.has(order.idPedido);
    }).length;
  }, [orders, now, sessionDeliveredIds]);

  /**
   * Envia (ou reenvia) o código gravado no pedido para o e-mail da cliente.
   * Devolve o destino mascarado; em falha, lança um Error com a mensagem para a equipe.
   */
  const sendCode = useCallback(async (order: ApiOrder): Promise<string> => {
    try {
      const delivery = await sendOrderPickupCode(order.idPedido);
      return delivery.destinatario;
    } catch (err) {
      throw new Error(sendErrorMessage(err));
    }
  }, []);

  /** Confirma a retirada no backend, que confere o PIN; nada é validado só no navegador. */
  const validateCode = useCallback(
    async (
      order: ApiOrder,
      enteredPin: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await confirmOrderPickup(order.idPedido, enteredPin.trim());
      } catch (err) {
        // 400 = PIN que não confere (ou pedido fora do estado de retirada).
        if (err instanceof ApiError && err.status !== 400) {
          return { success: false, error: "Não foi possível validar o código agora. Tente novamente." };
        }
        return { success: false, error: "invalid_code" };
      }

      setOrders((prev) =>
        prev.map((o) => (o.idPedido === order.idPedido ? { ...o, status: "delivered" } : o)),
      );
      setSessionDeliveredIds((prev) => new Set(prev).add(order.idPedido));
      return { success: true };
    },
    [],
  );

  return {
    orders,
    peopleMap,
    waitingCount,
    pickedUpTodayCount,
    isLoading,
    error,
    refetch,
    sendCode,
    resendCode: sendCode,
    validateCode,
  };
}
