import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProducts } from "@/hooks/useProducts";
import { fetchManagementOrders, type ApiOrder } from "@/lib/management";
import { Reports } from "./Reports";

vi.mock("@/lib/management", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/management")>()),
  fetchManagementOrders: vi.fn(),
}));
vi.mock("@/hooks/useProducts", () => ({ useProducts: vi.fn() }));
const fetchMock = vi.mocked(fetchManagementOrders);

const NOW = new Date("2026-10-27T12:00:00");

function order(
  idPedido: number,
  status: ApiOrder["status"],
  valorTotal: string,
  dataPedido: string,
  items: [string, number][],
): ApiOrder {
  return {
    idPedido,
    idUsuario: null,
    dataPedido,
    status,
    subtotal: valorTotal,
    valorFrete: 0,
    valorTotal,
    tipoRetirada: "entrega",
    codigoRastreamento: null,
    items: items.map(([idVariante, quantidade], index) => ({ idItemPedido: index, idVariante, quantidade, precoUnitario: 1 })),
  };
}

const orders = [
  order(1, "paid", "100.00", "2026-10-10T10:00:00", [["DK-009-RO-M", 2], ["DK-008-BO-G", 1]]),
  order(2, "delivered", "300.00", "2026-08-05T10:00:00", [["DK-009-RO-M", 1]]),
  order(3, "cancelled", "999.00", "2026-10-06T10:00:00", [["DK-012-PR-P", 50]]),
];

const products = [
  {
    idProduto: 9,
    titulo: "Princesa Rosé",
    sku: "DK-009",
    precoBase: 899,
    categories: [],
    variants: [{ codigoSku: "DK-009-RO-M", cor: "Rosa", tamanho: "M", ativo: true, images: [] }],
  },
];

const meta = { page: 1, limit: 100, total: 3, totalPages: 1 };
const rows = () => screen.getAllByRole("row").slice(1);
const kpi = (label: string) => screen.getAllByText(label, { selector: "p" })[0].nextElementSibling;

async function selectPeriod(value: string) {
  await userEvent.selectOptions(screen.getByLabelText(/^Período:/), value);
  await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
}

describe("Reports", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ data: orders, meta });
    vi.mocked(useProducts).mockReturnValue({ products } as unknown as ReturnType<typeof useProducts>);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("mostra os indicadores dos últimos 6 meses, a receita mensal e o ranking", async () => {
    render(<Reports now={NOW} />);
    expect(screen.getByText("Carregando dados")).toBeInTheDocument();
    await screen.findByText("Produtos mais vendidos");

    expect(screen.getByRole("heading", { level: 1, name: "Relatórios" })).toBeInTheDocument();
    // O pedido cancelado não entra na receita nem no ranking.
    expect(kpi("Receita")).toHaveTextContent("R$ 400,00");
    expect(kpi("Pedidos válidos")).toHaveTextContent("02");
    expect(kpi("Ticket médio")).toHaveTextContent("R$ 200,00");
    expect(screen.getAllByTestId("revenue-bar")).toHaveLength(6);
    expect(screen.getByText("Out").parentElement).toHaveTextContent("R$ 100,00");

    expect(rows()).toHaveLength(2);
    expect(rows()[0]).toHaveTextContent("DK-009-RO-M");
    expect(rows()[0]).toHaveTextContent("Princesa Rosé · Rosa / M");
    expect(rows()[0]).toHaveTextContent("3");
    expect(rows()[1]).toHaveTextContent("Fora do catálogo atual");
  });

  it("recalcula indicadores e ranking pelo período aplicado", async () => {
    render(<Reports now={NOW} />);
    await screen.findByText("Produtos mais vendidos");

    await selectPeriod("month");
    expect(kpi("Receita")).toHaveTextContent("R$ 100,00");
    expect(kpi("Pedidos válidos")).toHaveTextContent("01");
    expect(screen.getByLabelText("Período: este mês")).toBeInTheDocument();
    expect(rows()).toHaveLength(2);
    expect(rows()[0]).toHaveTextContent("2");
  });

  it("mostra sem resultados quando o período não tem vendas e limpa o filtro", async () => {
    fetchMock.mockResolvedValue({ data: [orders[1]], meta });
    render(<Reports now={NOW} />);
    await screen.findByText("Produtos mais vendidos");

    await selectPeriod("month");
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
    expect(kpi("Ticket médio")).toHaveTextContent("R$ 0,00");

    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(rows()).toHaveLength(1);
    expect(screen.getByLabelText("Período: últimos 6 meses")).toBeInTheDocument();
  });

  it("explica o cálculo dos indicadores", async () => {
    render(<Reports now={NOW} />);
    await screen.findByText("Produtos mais vendidos");

    await userEvent.click(screen.getByRole("button", { name: "Detalhar indicadores" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Como os indicadores são calculados" })).toBeInTheDocument();
    expect(within(dialog).getByText("Ranking").nextElementSibling).toHaveTextContent(
      "Quantidade vendida por SKU da variante",
    );

    await userEvent.click(within(dialog).getByRole("button", { name: "Entendi" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Detalhar indicadores" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("mostra o erro e tenta de novo", async () => {
    fetchMock.mockRejectedValueOnce(new Error("500"));
    render(<Reports now={NOW} />);

    expect(await screen.findByText("Não foi possível carregar os dados")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Produtos mais vendidos")).toBeInTheDocument();
  });
});
