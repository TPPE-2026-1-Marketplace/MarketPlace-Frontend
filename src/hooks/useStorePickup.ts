import { useCallback, useEffect, useMemo, useState } from "react";
import {
  confirmOrderPickup,
  fetchManagementOrders,
  fetchOrderVerificationCode,
  fetchPeople,
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

function generateLocalCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Hook da camada de apresentação para Retirada em Loja (Issue #175 / Figma 850:5726). */
export function useStorePickup(enabled: boolean, now: Date = new Date()) {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [peopleMap, setPeopleMap] = useState<Map<string, ApiPerson>>(new Map());
  const [sessionDeliveredIds, setSessionDeliveredIds] = useState<Set<number>>(new Set());
  const [activeCodes, setActiveCodes] = useState<Map<number, string>>(new Map());
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

  const sendCode = useCallback(
    async (order: ApiOrder): Promise<string> => {
      // 1. Se já existir código em memória, reutiliza
      const existing = activeCodes.get(order.idPedido);
      if (existing) return existing;

      // 2. Se o pedido já tiver código vindo do backend, usa-o
      if (order.codigoVerificacaoRetirada) {
        setActiveCodes((prev) => new Map(prev).set(order.idPedido, order.codigoVerificacaoRetirada!));
        return order.codigoVerificacaoRetirada;
      }

      // 3. Tenta buscar da API
      try {
        const res = await fetchOrderVerificationCode(order.idPedido);
        if (res?.codigoVerificacaoRetirada) {
          setActiveCodes((prev) => new Map(prev).set(order.idPedido, res.codigoVerificacaoRetirada));
          return res.codigoVerificacaoRetirada;
        }
      } catch {
        // Fallback local se o endpoint falhar ou em ambiente mock
      }

      // 4. Fallback gerado localmente
      const localCode = generateLocalCode();
      setActiveCodes((prev) => new Map(prev).set(order.idPedido, localCode));
      return localCode;
    },
    [activeCodes],
  );

  const resendCode = useCallback(
    async (order: ApiOrder): Promise<string> => {
      // Gera um novo código e armazena
      const nextCode = generateLocalCode();
      setActiveCodes((prev) => new Map(prev).set(order.idPedido, nextCode));
      return nextCode;
    },
    [],
  );

  const validateCode = useCallback(
    async (
      order: ApiOrder,
      enteredPin: string,
    ): Promise<{ success: boolean; error?: string }> => {
      const pin = enteredPin.trim();
      const expectedCode = activeCodes.get(order.idPedido) || order.codigoVerificacaoRetirada;

      try {
        await confirmOrderPickup(order.idPedido, pin);
        // Sucesso na API
        setOrders((prev) =>
          prev.map((o) => (o.idPedido === order.idPedido ? { ...o, status: "delivered" } : o)),
        );
        setSessionDeliveredIds((prev) => new Set(prev).add(order.idPedido));
        return { success: true };
      } catch {
        // Se a API retornou erro mas temos um código local em memória e o PIN confere (fallback local / mock)
        if (expectedCode && expectedCode === pin) {
          setOrders((prev) =>
            prev.map((o) => (o.idPedido === order.idPedido ? { ...o, status: "delivered" } : o)),
          );
          setSessionDeliveredIds((prev) => new Set(prev).add(order.idPedido));
          return { success: true };
        }
        return { success: false, error: "invalid_code" };
      }
    },
    [activeCodes],
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
    resendCode,
    validateCode,
  };
}
