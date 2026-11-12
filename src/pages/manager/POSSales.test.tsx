import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchManagementOrders, type ApiOrder } from "@/lib/management";
import { POSSales } from "./POSSales";

vi.mock("@/lib/management", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/management")>()),
  fetchManagementOrders: vi.fn(),
}));
const fetchMock = vi.mocked(fetchManagementOrders);

const ana = { cpf: "11111111111", codigo_funcionario: "ANA01", person: { nome: "Ana Silva" } };
const bruno = { cpf: "22222222222", codigo_funcionario: null, person: { nome: "Bruno Costa" } };

const base: Omit<ApiOrder, "idPedido" | "dataPedido"> = {
  idUsuario: null,
  status: "paid",
  subtotal: 100,
  valorFrete: 0,
  valorTotal: "100",
  tipoRetirada: "loja",
  codigoRastreamento: null,
  items: [],
};

const orders: ApiOrder[] = [
  {
    ...base,
    idPedido: 84,
    dataPedido: "2026-10-26T10:42:00",
    idFuncionario: ana.cpf,
    employee: ana,
    clienteNomeAvulso: "Marina Oliveira",
    clienteCpfAvulso: "12345678900",
    valorTotal: "899.9",
    items: [{ idItemPedido: 1, idVariante: "ROSA-M", quantidade: 1, precoUnitario: "899.9" }],
  },
  { ...base, idPedido: 83, dataPedido: "2026-10-25T09:00:00", idFuncionario: bruno.cpf, employee: bruno, user: { nome: "Camila Souza" }, valorTotal: "1249" },
  // Venda de setembro: fora de "este mês".
  { ...base, idPedido: 70, dataPedido: "2026-09-02T09:00:00", idFuncionario: ana.cpf, employee: ana, clienteCpfAvulso: "98765432100", valorTotal: "599" },
  // Pedido online com retirada na loja: não é venda do PDV.
  { ...base, idPedido: 90, dataPedido: "2026-10-26T12:00:00", user: { nome: "Online" }, valorTotal: "50" },
];

const meta = { page: 1, limit: 100, total: orders.length, totalPages: 1 };
const rows = () => screen.getAllByRole("row").slice(1);
const kpi = (label: string) => screen.getByText(label, { selector: "p" }).nextElementSibling;

async function renderSales() {
  render(<POSSales />);
  await screen.findByText("#PDV-084");
}

async function applyFilters(values: { search?: string; seller?: string; period?: string }) {
  const search = screen.getByLabelText("Buscar venda, vendedor ou cliente");
  await userEvent.clear(search);
  if (values.search) await userEvent.type(search, values.search);
  await userEvent.selectOptions(screen.getByLabelText(/^Vendedor:/), values.seller ?? "all");
  await userEvent.selectOptions(screen.getByLabelText(/^Período:/), values.period ?? "month");
  await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
}

describe("POSSales", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-27T12:00:00"));
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ data: orders, meta });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lista só as vendas do PDV do mês, com indicadores do período", async () => {
    render(<POSSales />);
    expect(screen.getByText("Carregando dados")).toBeInTheDocument();
    await screen.findByText("#PDV-084");

    expect(screen.getByRole("heading", { level: 1, name: "Vendas PDV" })).toBeInTheDocument();
    expect(kpi("Vendas presenciais")).toHaveTextContent("02");
    expect(kpi("Total vendido")).toHaveTextContent("R$ 2.148,90");
    expect(kpi("Vendedores")).toHaveTextContent("02");

    expect(rows()).toHaveLength(2);
    expect(rows()[0]).toHaveTextContent("#PDV-084");
    expect(rows()[0]).toHaveTextContent("26 out");
    expect(rows()[0]).toHaveTextContent("Ana Silva");
    expect(rows()[0]).toHaveTextContent("Marina");
    expect(rows()[0]).not.toHaveTextContent("Oliveira");
    expect(rows()[0]).toHaveTextContent("Não registrado");
    expect(rows()[1]).toHaveTextContent("Bruno Costa");
    // O pedido online com retirada na loja não aparece.
    expect(screen.queryByText("#PDV-090")).not.toBeInTheDocument();
    expect(screen.getByText("Acesso conforme o perfil do usuário")).toBeInTheDocument();
  });

  it("filtra por período, vendedor e busca, mostrando CPF mascarado sem nome", async () => {
    await renderSales();

    await applyFilters({ period: "all" });
    expect(rows()).toHaveLength(3);
    expect(kpi("Vendas presenciais")).toHaveTextContent("03");
    expect(rows()[2]).toHaveTextContent("***.***.***-00");

    await applyFilters({ period: "all", seller: bruno.cpf });
    expect(rows()).toHaveLength(1);
    expect(screen.getByLabelText("Vendedor: Bruno Costa")).toBeInTheDocument();

    await applyFilters({ period: "all", search: "ana01" });
    expect(rows()).toHaveLength(2);

    await applyFilters({ period: "all", search: "PDV-083" });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent("Bruno Costa");

    await applyFilters({ period: "today" });
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(rows()).toHaveLength(3);
  });

  it("abre o detalhe da venda e fecha pelas duas ações", async () => {
    await renderSales();

    await userEvent.click(screen.getByRole("button", { name: "Detalhes da venda #PDV-084" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Venda #PDV-084" })).toBeInTheDocument();
    expect(within(dialog).getByText("Data").nextElementSibling).toHaveTextContent("26/10/2026, 10:42");
    expect(within(dialog).getByText("Vendedor").nextElementSibling).toHaveTextContent("Ana Silva / ANA01");
    expect(within(dialog).getByText("Cliente").nextElementSibling).toHaveTextContent(
      "Marina Oliveira · ***.***.***-00",
    );
    expect(within(dialog).getByText("Itens").nextElementSibling).toHaveTextContent("ROSA-M · 1");
    expect(within(dialog).getByText("Total").nextElementSibling).toHaveTextContent("R$ 899,90");

    await userEvent.click(within(dialog).getByRole("button", { name: "Voltar às vendas" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Detalhes da venda #PDV-083" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("mostra o erro e tenta de novo", async () => {
    fetchMock.mockRejectedValueOnce(new Error("500"));
    render(<POSSales />);

    expect(await screen.findByText("Não foi possível carregar os dados")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("#PDV-084")).toBeInTheDocument();
  });
});
