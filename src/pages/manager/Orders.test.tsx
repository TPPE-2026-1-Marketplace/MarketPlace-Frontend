import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { fetchManagementOrders, type ApiOrder } from "@/lib/management";
import { Orders } from "./Orders";

vi.mock("@/lib/management", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/management")>()),
  fetchManagementOrders: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ api: { patch: vi.fn() } }));
const fetchMock = vi.mocked(fetchManagementOrders);
const patchMock = vi.mocked(api.patch);

const base: Omit<ApiOrder, "idPedido" | "status" | "tipoRetirada"> = {
  idUsuario: null,
  dataPedido: "2026-09-10T12:00:00",
  subtotal: 100,
  valorFrete: 0,
  valorTotal: "100",
  codigoRastreamento: null,
  items: [],
};

const orders: ApiOrder[] = [
  {
    ...base,
    idPedido: 10,
    status: "paid",
    tipoRetirada: "entrega",
    user: { nome: "Maria Online" },
    items: [{ idItemPedido: 1, idVariante: "ROSA-P", quantidade: 2, precoUnitario: "50" }],
  },
  { ...base, idPedido: 20, status: "pending", tipoRetirada: "loja", clienteNomeAvulso: "Joana Balcão" },
  { ...base, idPedido: 30, status: "delivered", tipoRetirada: "entrega", clienteCpfAvulso: "99988877766" },
  { ...base, idPedido: 40, status: "cancelled", tipoRetirada: "loja" },
];

const meta = { page: 1, limit: 100, total: 4, totalPages: 1 };
const rows = () => screen.getAllByRole("row").slice(1);

describe("Orders", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    patchMock.mockReset();
    fetchMock.mockResolvedValue({ data: orders, meta });
  });

  it("lista os pedidos com cliente, modalidade e status", async () => {
    render(<Orders />);
    expect(screen.getByText("Carregando pedidos...")).toBeInTheDocument();

    expect(await screen.findByText("Maria Online")).toBeInTheDocument();
    expect(screen.getByText("4 pedido(s) carregado(s) do backend")).toBeInTheDocument();
    expect(screen.getByText("Joana Balcão")).toBeInTheDocument();
    expect(screen.getByText("99988877766")).toBeInTheDocument();
    expect(screen.getByText("Não identificado")).toBeInTheDocument();
    expect(within(rows()[0]).getByText("Entrega")).toBeInTheDocument();
    expect(within(rows()[1]).getByText("Retirada")).toBeInTheDocument();
    expect(screen.getAllByTitle("Atualizar rastreamento")).toHaveLength(1);
  });

  it("filtra por busca, status e modalidade", async () => {
    render(<Orders />);
    await screen.findByText("Maria Online");
    const search = screen.getByPlaceholderText("Buscar por pedido, CPF ou SKU da variante...");

    await userEvent.type(search, "rosa-p");
    expect(rows()).toHaveLength(1);
    await userEvent.clear(search);
    await userEvent.type(search, "joana");
    expect(screen.getByText("Joana Balcão")).toBeInTheDocument();
    await userEvent.clear(search);
    await userEvent.type(search, "999888");
    expect(rows()).toHaveLength(1);
    await userEvent.clear(search);

    await userEvent.selectOptions(screen.getByRole("combobox"), "cancelled");
    expect(rows()).toHaveLength(1);
    await userEvent.selectOptions(screen.getByRole("combobox"), "all");

    await userEvent.click(screen.getByRole("button", { name: "Loja" }));
    expect(rows()).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Entrega" }));
    expect(rows()).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Todos" }));
    expect(rows()).toHaveLength(4);

    await userEvent.type(search, "nada");
    expect(screen.getByText("Nenhum pedido real encontrado.")).toBeInTheDocument();
  });

  it("atualiza o código de rastreamento", async () => {
    const prompt = vi.spyOn(window, "prompt").mockReturnValueOnce("  ").mockReturnValueOnce(" BR123 ");
    patchMock.mockResolvedValue(undefined);
    render(<Orders />);
    await screen.findByText("Maria Online");

    await userEvent.click(screen.getByTitle("Atualizar rastreamento"));
    expect(patchMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTitle("Atualizar rastreamento"));
    expect(prompt).toHaveBeenLastCalledWith("Informe o código de rastreamento", "");
    expect(patchMock).toHaveBeenCalledWith("/orders/10/tracking", { codigo_rastreamento: "BR123" });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("mostra erro ao falhar o rastreamento", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "prompt").mockReturnValue("BR1");
    patchMock.mockRejectedValueOnce(new Error("500"));
    render(<Orders />);
    await screen.findByText("Maria Online");

    await userEvent.click(screen.getByTitle("Atualizar rastreamento"));

    expect(await screen.findByText("Não foi possível atualizar o rastreamento deste pedido.")).toBeInTheDocument();
  });

  it("abre os detalhes, muda o status e fecha o modal", async () => {
    patchMock.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("500"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Orders />);
    await screen.findByText("Maria Online");

    await userEvent.click(within(rows()[0]).getByTitle("Ver detalhes"));
    expect(screen.getByText("Pedido #10")).toBeInTheDocument();
    expect(screen.getByText("Quantidade: 2")).toBeInTheDocument();
    const statusSelect = screen.getAllByRole("combobox")[1];
    expect(within(statusSelect).queryByRole("option", { name: "Pago" })).not.toBeInTheDocument();

    await userEvent.selectOptions(statusSelect, "shipped");
    expect(patchMock).toHaveBeenCalledWith("/orders/10/status", { status: "shipped" });

    await userEvent.selectOptions(statusSelect, "delivered");
    expect(await screen.findByText("Não foi possível atualizar o status deste pedido.")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Pedido #10").nextElementSibling as HTMLElement);
    expect(screen.queryByText("Pedido #10")).not.toBeInTheDocument();

    await userEvent.click(within(rows()[1]).getByTitle("Ver detalhes"));
    expect(screen.getByText("Pedido sem itens retornados pela API.")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });

  it("mostra erro quando a lista não carrega", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("500"));
    render(<Orders />);

    expect(await screen.findByText("Não foi possível carregar os pedidos do backend.")).toBeInTheDocument();
  });
});
