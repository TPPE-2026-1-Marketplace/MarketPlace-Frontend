import { describe, expect, it } from "vitest";
import type { ApiOrder } from "@/lib/management";
import { ordersInPeriod, periodStart, revenueByMonth, summarizeOrders } from "./useAdminOverview";

const NOW = new Date("2026-10-20T12:00:00");

const order = (idPedido: number, dataPedido: string, status: ApiOrder["status"], valorTotal: string): ApiOrder => ({
  idPedido,
  idUsuario: null,
  dataPedido,
  status,
  subtotal: valorTotal,
  valorFrete: 0,
  valorTotal,
  tipoRetirada: "entrega",
  codigoRastreamento: null,
  items: [],
});

const orders = [
  order(1, "2026-10-18T10:00:00", "pending", "100"),
  order(2, "2026-10-01T00:00:00", "paid", "300"),
  order(3, "2026-10-02T10:00:00", "cancelled", "999"),
  order(4, "2026-09-25T10:00:00", "shipped", "200"),
  order(5, "2026-05-01T00:00:00", "delivered", "50"),
  order(6, "2026-04-30T10:00:00", "delivered", "5000"),
  order(7, "2026-10-21T10:00:00", "paid", "70"),
];

describe("useAdminOverview (cálculos)", () => {
  it("calcula o início de cada período", () => {
    expect(periodStart("month", NOW)).toEqual(new Date(2026, 9, 1));
    expect(periodStart("30d", NOW)).toEqual(new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000));
    expect(periodStart("6m", NOW)).toEqual(new Date(2026, 4, 1));
  });

  it("filtra os pedidos do período sem incluir datas futuras", () => {
    expect(ordersInPeriod(orders, "month", NOW).map((o) => o.idPedido)).toEqual([1, 2, 3]);
    expect(ordersInPeriod(orders, "30d", NOW).map((o) => o.idPedido)).toEqual([1, 2, 3, 4]);
    expect(ordersInPeriod(orders, "6m", NOW).map((o) => o.idPedido)).toEqual([1, 2, 3, 4, 5]);
  });

  it("soma a receita por mês sem os cancelados", () => {
    expect(revenueByMonth(orders, NOW)).toEqual([
      { label: "Mai", value: 50 },
      { label: "Jun", value: 0 },
      { label: "Jul", value: 0 },
      { label: "Ago", value: 0 },
      { label: "Set", value: 200 },
      { label: "Out", value: 470 },
    ]);
  });

  it("resume receita, pedidos válidos, ticket médio e pendentes", () => {
    expect(summarizeOrders(orders.slice(0, 3))).toEqual({
      revenue: 400,
      validOrders: 2,
      averageTicket: 200,
      pendingOrders: 1,
    });
    expect(summarizeOrders([])).toEqual({ revenue: 0, validOrders: 0, averageTicket: 0, pendingOrders: 0 });
  });
});
