import { useMemo, useState } from "react";
import type { RevenueMonth } from "@/components/manager/RevenueChart";
import type { ApiOrder } from "@/lib/management";
import { sumInventory, toInventoryRows } from "@/hooks/useInventoryRows";
import { useManagementOrders } from "@/hooks/useManagementOrders";
import { useProducts } from "@/hooks/useProducts";

export type OverviewPeriod = "month" | "30d" | "6m";

export const OVERVIEW_PERIOD_LABELS: Record<OverviewPeriod, string> = {
  month: "Este mês",
  "30d": "Últimos 30 dias",
  "6m": "Últimos 6 meses",
};

const DAY = 24 * 60 * 60 * 1000;
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Início do período (inclusivo) relativo a `now`. */
export function periodStart(period: OverviewPeriod, now: Date): Date {
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "30d") return new Date(now.getTime() - 30 * DAY);
  return new Date(now.getFullYear(), now.getMonth() - 5, 1);
}

export function ordersInPeriod(orders: ApiOrder[], period: OverviewPeriod, now: Date): ApiOrder[] {
  const start = periodStart(period, now).getTime();
  return orders.filter((order) => {
    const time = new Date(order.dataPedido).getTime();
    return time >= start && time <= now.getTime();
  });
}

const isValid = (order: ApiOrder) => order.status !== "cancelled";

/** Receita dos pedidos não cancelados nos últimos 6 meses, do mais antigo ao atual. */
export function revenueByMonth(orders: ApiOrder[], now: Date): RevenueMonth[] {
  return Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const value = orders
      .filter((order) => {
        const date = new Date(order.dataPedido);
        return isValid(order) && date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
      })
      .reduce((sum, order) => sum + Number(order.valorTotal), 0);
    return { label: MONTH_LABELS[month.getMonth()], value };
  });
}

export function summarizeOrders(orders: ApiOrder[]) {
  const valid = orders.filter(isValid);
  const revenue = valid.reduce((sum, order) => sum + Number(order.valorTotal), 0);
  return {
    revenue,
    validOrders: valid.length,
    averageTicket: valid.length > 0 ? revenue / valid.length : 0,
    pendingOrders: orders.filter((order) => order.status === "pending").length,
  };
}

/** Dados da Visão geral: indicadores do período, receita mensal e registros recentes. */
export function useAdminOverview(period: OverviewPeriod, now?: Date) {
  const ordersState = useManagementOrders();
  const productsState = useProducts({ page: 1, limit: 100 });
  // Data de referência fixa enquanto a tela está aberta (os testes passam `now`).
  const [openedAt] = useState(() => new Date());
  const nowTime = (now ?? openedAt).getTime();

  const data = useMemo(() => {
    const reference = new Date(nowTime);
    const periodOrders = ordersInPeriod(ordersState.orders, period, reference).sort(
      (a, b) => new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime(),
    );
    return {
      summary: summarizeOrders(periodOrders),
      stock: sumInventory(toInventoryRows(productsState.products)),
      months: revenueByMonth(ordersState.orders, reference),
      recentOrders: periodOrders,
    };
  }, [ordersState.orders, productsState.products, period, nowTime]);

  const refetch = () => {
    void ordersState.refetch();
    productsState.refetch();
  };

  return {
    ...data,
    isLoading: ordersState.isLoading || productsState.isLoading,
    error: ordersState.error ?? productsState.error,
    refetch,
  };
}
