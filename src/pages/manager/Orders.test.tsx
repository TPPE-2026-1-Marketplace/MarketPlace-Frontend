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

const base: Omit<ApiOrder, "idPedido" | "status" | "tipoRetirada" | "dataPedido"> = {
  idUsuario: null,
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
    dataPedido: "2026-09-13T12:00:00",
    status: "paid",
    tipoRetirada: "entrega",
    idUsuario: "12345678900",
    user: { nome: "Maria Online" },
    valorTotal: "899.9",
    items: [{ idItemPedido: 1, idVariante: "ROSA-P", quantidade: 2, precoUnitario: "50" }],
  },
  { ...base, idPedido: 20, dataPedido: "2026-09-12T12:00:00", status: "pending", tipoRetirada: "loja", clienteNomeAvulso: "Joana Balcão" },
  { ...base, idPedido: 30, dataPedido: "2026-09-11T12:00:00", status: "delivered", tipoRetirada: "entrega", clienteCpfAvulso: "99988877766" },
  { ...base, idPedido: 40, dataPedido: "2026-09-10T12:00:00", status: "cancelled", tipoRetirada: "loja" },
  { ...base, idPedido: 50, dataPedido: "2026-09-14T12:00:00", status: "shipped", tipoRetirada: "entrega", codigoRastreamento: "BR999" },
];

const meta = { page: 1, limit: 100, total: orders.length, totalPages: 1 };
const rows = () => screen.getAllByRole("row").slice(1);
const row = (id: number) => screen.getByText(`#${id}`).closest("tr") as HTMLElement;
const kpi = (label: string) => screen.getByText(label, { selector: "p" }).nextElementSibling;

async function renderOrders(readOnly = false) {
  render(<Orders readOnly={readOnly} />);
  await screen.findByText("#10");
}

async function applyFilters(values: { search?: string; status?: string; pickup?: string }) {
  const search = screen.getByLabelText("Buscar pedido, CPF ou SKU");
  await userEvent.clear(search);
  if (values.search) await userEvent.type(search, values.search);
  await userEvent.selectOptions(screen.getByLabelText(/^Status:/), values.status ?? "all");
  await userEvent.selectOptions(screen.getByLabelText(/^Modalidade:/), values.pickup ?? "all");
  await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
}

async function openOrder(id: number) {
  await userEvent.click(screen.getByRole("button", { name: `Ver pedido #${id}` }));
  return screen.getByRole("dialog");
}

describe("Orders", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    patchMock.mockReset();
    fetchMock.mockResolvedValue({ data: orders, meta });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("lista os pedidos do mais recente com indicadores e CPF mascarado", async () => {
    render(<Orders />);
    expect(screen.getByText("Carregando dados")).toBeInTheDocument();
    await screen.findByText("#10");

    expect(screen.getByRole("heading", { level: 1, name: "Pedidos" })).toBeInTheDocument();
    expect(kpi("Pendentes")).toHaveTextContent("01");
    expect(kpi("Em separação")).toHaveTextContent("01");
    expect(kpi("Enviados")).toHaveTextContent("01");
    // Retirada na loja: só a que ainda não foi entregue nem cancelada.
    expect(kpi("Retirada na loja")).toHaveTextContent("01");

    expect(rows().map((tr) => within(tr).getAllByRole("cell")[0].textContent)).toEqual([
      "Pedido: #50",
      "Pedido: #10",
      "Pedido: #20",
      "Pedido: #30",
      "Pedido: #40",
    ]);
    expect(within(row(10)).getByText("Maria Online · ***.***.***-00")).toBeInTheDocument();
    expect(within(row(10)).getByText("R$ 899,90")).toBeInTheDocument();
    expect(within(row(10)).getByText("Pago")).toBeInTheDocument();
    expect(within(row(20)).getByText("Joana Balcão")).toBeInTheDocument();
    expect(within(row(20)).getByText("Loja")).toBeInTheDocument();
    expect(within(row(30)).getByText("Cliente não identificado · ***.***.***-66")).toBeInTheDocument();
  });

  it("filtra por busca, status e modalidade e limpa os filtros", async () => {
    await renderOrders();

    await applyFilters({ search: "rosa-p" });
    expect(rows()).toHaveLength(1);
    await applyFilters({ search: "joana" });
    expect(screen.getByText("#20")).toBeInTheDocument();
    await applyFilters({ search: "999.888" });
    expect(screen.getByText("#30")).toBeInTheDocument();
    expect(rows()).toHaveLength(1);
    await applyFilters({ search: "#40" });
    expect(rows()).toHaveLength(1);
    await applyFilters({ status: "cancelled" });
    expect(rows()).toHaveLength(1);
    await applyFilters({ pickup: "loja" });
    expect(rows()).toHaveLength(2);
    await applyFilters({ pickup: "entrega" });
    expect(rows()).toHaveLength(3);

    // O filtro só vale depois de "Aplicar filtros".
    await userEvent.type(screen.getByLabelText("Buscar pedido, CPF ou SKU"), "nada");
    expect(rows()).toHaveLength(3);
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(rows()).toHaveLength(5);
  });

  it("'Buscar pedido' leva o foco ao campo de busca", async () => {
    await renderOrders();

    await userEvent.click(screen.getByRole("button", { name: "Buscar pedido" }));
    expect(screen.getByLabelText("Buscar pedido, CPF ou SKU")).toHaveFocus();
  });

  it("abre o pedido, salva o status e mostra a confirmação", async () => {
    patchMock.mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce(undefined);
    await renderOrders();

    const dialog = await openOrder(10);
    expect(within(dialog).getByRole("heading", { name: "Pedido #10" })).toBeInTheDocument();
    expect(within(dialog).getByText("Maria Online · ***.***.***-00")).toBeInTheDocument();
    expect(within(dialog).getByText("ROSA-P · 2 unidades")).toBeInTheDocument();
    expect(within(dialog).getByText("Entrega em casa")).toBeInTheDocument();
    const status = within(dialog).getByLabelText("Status do pedido");
    // "Pago" aparece só por ser o status atual; a gestão não marca pedidos como pagos.
    expect(within(status).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Pago",
      "Pendente",
      "Enviado",
      "Entregue",
      "Cancelado",
    ]);
    expect(within(dialog).getByRole("button", { name: "Salvar alterações" })).toBeDisabled();

    await userEvent.selectOptions(status, "delivered");
    await userEvent.click(within(dialog).getByRole("button", { name: "Salvar alterações" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Não foi possível atualizar o status deste pedido.");

    await userEvent.click(within(dialog).getByRole("button", { name: "Salvar alterações" }));
    expect(patchMock).toHaveBeenLastCalledWith("/orders/10/status", { status: "delivered" });
    expect(await screen.findByRole("heading", { name: "Alterações salvas" })).toBeInTheDocument();
    expect(screen.getByText("Pedido #10 marcado como entregue")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(row(10)).getByText("Entregue")).toBeInTheDocument();
  });

  it("atualiza o rastreio e o pedido passa a enviado", async () => {
    patchMock.mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce(undefined);
    await renderOrders();

    const dialog = await openOrder(10);
    const tracking = within(dialog).getByLabelText("Rastreio");
    expect(within(dialog).getByRole("button", { name: "Atualizar rastreio" })).toBeDisabled();
    await userEvent.type(tracking, " BR123 ");
    await userEvent.click(within(dialog).getByRole("button", { name: "Atualizar rastreio" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Não foi possível atualizar o rastreio deste pedido.");

    await userEvent.click(within(dialog).getByRole("button", { name: "Atualizar rastreio" }));
    expect(patchMock).toHaveBeenLastCalledWith("/orders/10/tracking", { codigo_rastreamento: "BR123" });
    expect(await screen.findByText("Rastreio do pedido #10 atualizado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(within(row(10)).getByText("Enviado")).toBeInTheDocument();
    expect(kpi("Enviados")).toHaveTextContent("02");
  });

  it("retirada na loja e perfil somente leitura não editam o pedido", async () => {
    await renderOrders(true);

    let dialog = await openOrder(10);
    expect(within(dialog).getByText("Pago")).toBeInTheDocument();
    expect(within(dialog).queryByRole("combobox")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Salvar alterações" })).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    dialog = await openOrder(50);
    expect(within(dialog).getByText("BR999")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    dialog = await openOrder(20);
    expect(within(dialog).getByText("Retirada na loja")).toBeInTheDocument();
    expect(within(dialog).getByText("Pedido sem itens retornados pela API")).toBeInTheDocument();
    expect(within(dialog).queryByText("Rastreio")).not.toBeInTheDocument();
  });

  it("mostra erro quando a lista não carrega e tenta de novo", async () => {
    fetchMock.mockRejectedValueOnce(new Error("500"));
    render(<Orders />);

    expect(await screen.findByText("Não foi possível carregar os pedidos.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("#10")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
