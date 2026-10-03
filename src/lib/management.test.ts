import { describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { fetchManagementOrders, fetchPeople, ORDER_STATUS_LABELS } from "./management";

vi.mock("./api", () => ({ api: { get: vi.fn().mockResolvedValue({ data: [], meta: {} }) } }));

describe("management", () => {
  it("traduz todos os status de pedido", () => {
    expect(ORDER_STATUS_LABELS).toEqual({
      pending: "Pendente",
      paid: "Pago",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    });
  });

  it("busca pedidos e pessoas com paginação de 100 itens", async () => {
    await fetchManagementOrders();
    await fetchPeople();

    expect(api.get).toHaveBeenCalledWith("/orders", { page: 1, limit: 100 });
    expect(api.get).toHaveBeenCalledWith("/people", { page: 1, limit: 100 });
  });
});
