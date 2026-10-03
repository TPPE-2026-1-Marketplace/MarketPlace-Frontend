import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fetchManagementOrders, type ApiOrder } from "@/lib/management";
import { Reports } from "./Reports";

vi.mock("@/lib/management", () => ({ fetchManagementOrders: vi.fn() }));

function order(id: number, status: ApiOrder["status"], valorTotal: string, dataPedido: string, items: [string, number][]): ApiOrder {
  return {
    idPedido: id,
    idUsuario: null,
    dataPedido,
    status,
    subtotal: valorTotal,
    valorFrete: 0,
    valorTotal,
    tipoRetirada: "loja",
    codigoRastreamento: null,
    items: items.map(([idVariante, quantidade], i) => ({ idItemPedido: i, idVariante, quantidade, precoUnitario: 1 })),
  };
}

const meta = { page: 1, limit: 100, total: 0, totalPages: 1 };

describe("Reports", () => {
  it("calcula receita, pedidos válidos, ticket médio e variantes mais vendidas", async () => {
    vi.mocked(fetchManagementOrders).mockResolvedValueOnce({
      data: [
        order(1, "paid", "100.00", "2026-08-10T10:00:00", [["SKU-A", 2], ["SKU-B", 1]]),
        order(2, "delivered", "300.00", "2026-09-05T10:00:00", [["SKU-A", 1]]),
        order(3, "cancelled", "999.00", "2026-09-06T10:00:00", [["SKU-C", 50]]),
      ],
      meta,
    });
    render(<Reports />);
    expect(screen.getByText("Carregando relatórios...")).toBeInTheDocument();

    expect(await screen.findByText("R$ 400,00")).toBeInTheDocument();
    expect(screen.getByText("Pedidos válidos").nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText("R$ 200,00")).toBeInTheDocument();
    expect(screen.getByText("Receita por mês")).toBeInTheDocument();
    const skus = screen.getAllByText(/^SKU-/).map((el) => el.textContent);
    expect(skus).toEqual(["SKU-A", "SKU-B"]);
    expect(screen.getByText("3 un.")).toBeInTheDocument();
  });

  it("mostra estado vazio sem pedidos", async () => {
    vi.mocked(fetchManagementOrders).mockResolvedValueOnce({ data: [], meta });
    render(<Reports />);

    expect(await screen.findByText("Ainda não há pedidos reais para gerar métricas.")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 0,00")).toHaveLength(2);
  });

  it("indica quando só há pedidos cancelados", async () => {
    vi.mocked(fetchManagementOrders).mockResolvedValueOnce({
      data: [order(1, "cancelled", "50", "2026-09-01T10:00:00", [["X", 1]])],
      meta,
    });
    render(<Reports />);

    expect(await screen.findByText("Não há itens vendidos.")).toBeInTheDocument();
  });

  it("mostra erro quando a API falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchManagementOrders).mockRejectedValueOnce(new Error("500"));
    render(<Reports />);

    expect(await screen.findByText("Não foi possível carregar os dados reais para os relatórios.")).toBeInTheDocument();
  });
});
