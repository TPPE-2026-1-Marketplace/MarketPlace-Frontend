import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../lib/api";
import { apiRouter } from "@/test/apiRouter";
import { manager, renderWithProviders, superadmin } from "@/test/render";
import { Commissions } from "./Commissions";

vi.mock("../../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
const getMock = vi.mocked(api.get);

const employees = {
  data: [
    { cpf: "111", ativo: true, role_perfil: "vendedor", taxa_comissao: 0.05, meta_vendas: 1000, person: { nome: "Ana Vendas", email: "ana@dk.com" } },
    { cpf: "222", ativo: true, role_perfil: "vendedor", taxa_comissao: 0.04, meta_vendas: 2000, person: { nome: "Bruno Loja", email: "bruno@dk.com" } },
    { cpf: "333", ativo: true, role_perfil: "vendedor", taxa_comissao: 0.03, meta_vendas: 0, person: { nome: "Carla Nova", email: "carla@dk.com" } },
    { cpf: "444", ativo: false, role_perfil: "vendedor", taxa_comissao: 0.05, meta_vendas: 0, person: { nome: "Vendedor Desligado", email: "x" } },
    { cpf: "555", ativo: true, role_perfil: "gerente", taxa_comissao: 0, meta_vendas: 0, person: { nome: "Gerente", email: "g" } },
  ],
};

const reports: Record<string, unknown> = {
  "111": {
    total_vendas: 1500,
    comissao: 175,
    meta_batida: true,
    meta_vendas: 1000,
    valor_bonus: 100,
    pedidos: [
      { idPedido: 9, dataPedido: "2026-09-10T12:00:00", valorTotal: "1000", cliente: { person: { nome: "Maria" } }, itens: [{}, {}] },
      { idPedido: 10, dataPedido: "2026-09-11T12:00:00", valorTotal: "500" },
    ],
  },
  "222": { total_vendas: 2100, comissao: 84, meta_batida: true, meta_vendas: 2000, valor_bonus: 0, pedidos: [] },
};

function backend(goals: unknown[] = []) {
  getMock.mockImplementation(
    apiRouter({
      "/employees?limit=100": employees,
      "/employees/111/commissions": reports["111"],
      "/employees/222/commissions": reports["222"],
      "/employees/333/commissions": () => Promise.reject(new Error("sem relatório")),
      "/sales-goals": goals,
    }) as never,
  );
}

const card = (name: string) => screen.getByText(name).closest("div.bg-white") as HTMLElement;

async function renderCommissions(user = superadmin) {
  renderWithProviders(<Commissions />, { user });
  await screen.findByText("Comissões e Metas");
}

describe("Commissions", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getMock.mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.post).mockReset();
    backend();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lista só vendedores ativos com os indicadores do mês", async () => {
    renderWithProviders(<Commissions />, { user: superadmin });
    expect(screen.getByText("Carregando comissões...")).toBeInTheDocument();
    await screen.findByText("Comissões e Metas");

    expect(screen.queryByText("Vendedor Desligado")).not.toBeInTheDocument();
    expect(screen.queryByText("Gerente")).not.toBeInTheDocument();
    expect(screen.getByText("Total em Vendas").parentElement).toHaveTextContent("R$ 3.600,00");
    expect(screen.getByText("Metas Atingidas").parentElement).toHaveTextContent("2 / 3");
    expect(within(card("Ana Vendas")).getByText("Bônus ganho")).toBeInTheDocument();
    expect(within(card("Bruno Loja")).getByText("Meta atingida")).toBeInTheDocument();
    expect(within(card("Carla Nova")).getByText("0% da meta")).toBeInTheDocument();
  });

  it("expande o histórico de vendas", async () => {
    await renderCommissions();
    const ana = card("Ana Vendas");
    const expand = within(ana).getAllByRole("button").slice(-1)[0];

    await userEvent.click(expand);
    expect(screen.getByText("Histórico de Vendas (2 registros)")).toBeInTheDocument();
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("Venda Avulsa")).toBeInTheDocument();
    expect(screen.getByText("2 item(ns)")).toBeInTheDocument();
    expect(screen.getByText("R$ 50,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 75,00")).toBeInTheDocument();
    await userEvent.click(expand);
    expect(screen.queryByText(/Histórico de Vendas/)).not.toBeInTheDocument();

    await userEvent.click(within(card("Bruno Loja")).getAllByRole("button").slice(-1)[0]);
    expect(screen.getByText("Nenhuma venda registrada.")).toBeInTheDocument();
  });

  it("gerente não edita e vê o aviso", async () => {
    await renderCommissions(manager);

    expect(screen.getByText("Apenas o Super Admin pode alterar taxas de comissão e metas.")).toBeInTheDocument();
    expect(within(card("Ana Vendas")).getAllByRole("button")).toHaveLength(1);
  });

  it("edita taxa, meta e bônus criando a meta do mês", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(api.patch).mockResolvedValue({});
    vi.mocked(api.post).mockResolvedValue({});
    await renderCommissions();

    await userEvent.click(within(card("Ana Vendas")).getAllByRole("button")[0]);
    const [taxa, meta, bonus] = within(card("Ana Vendas")).getAllByRole("spinbutton");
    expect(taxa).toHaveValue(5);
    expect(meta).toHaveValue(1000);
    expect(bonus).toHaveValue(100);
    fireEvent.change(taxa, { target: { value: "6" } });
    fireEvent.change(meta, { target: { value: "1200" } });
    fireEvent.change(bonus, { target: { value: "150" } });

    await userEvent.click(within(card("Ana Vendas")).getAllByRole("button")[0]);

    expect(api.patch).toHaveBeenCalledWith("/employees/111", { taxa_comissao: 0.06, meta_vendas: 1200 });
    expect(api.post).toHaveBeenCalledWith("/sales-goals", expect.objectContaining({ cpfFuncionario: "111", valorMeta: 1200, valorBonus: 150 }));
    expect(await screen.findByText("Salvo!")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText("Salvo!")).not.toBeInTheDocument();
  });

  it("atualiza a meta existente e zera o bônus desativado", async () => {
    backend([{ idGoal: 7, cpfFuncionario: "222" }]);
    vi.mocked(api.patch).mockResolvedValue({});
    await renderCommissions();

    await userEvent.click(within(card("Bruno Loja")).getAllByRole("button")[0]);
    const checkbox = within(card("Bruno Loja")).getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await userEvent.click(checkbox);
    await userEvent.click(within(card("Bruno Loja")).getAllByRole("button")[0]);

    expect(await screen.findByText("Salvo!")).toBeInTheDocument();
    expect(api.patch).toHaveBeenCalledWith("/sales-goals/7", expect.objectContaining({ valorBonus: 0 }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("cancela a edição e avisa quando salvar falha", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(api.patch).mockRejectedValueOnce(new Error("500"));
    await renderCommissions();

    await userEvent.click(within(card("Carla Nova")).getAllByRole("button")[0]);
    expect(within(card("Carla Nova")).getAllByRole("spinbutton")).toHaveLength(3);
    await userEvent.click(within(card("Carla Nova")).getAllByRole("button")[1]);
    expect(within(card("Carla Nova")).queryAllByRole("spinbutton")).toHaveLength(0);

    await userEvent.click(within(card("Carla Nova")).getAllByRole("button")[0]);
    await userEvent.click(within(card("Carla Nova")).getAllByRole("button")[0]);
    expect(alert).toHaveBeenCalledWith("Erro ao salvar as configurações de comissão");
  });

  it("mostra lista vazia quando a API de funcionários falha", async () => {
    getMock.mockRejectedValue(new Error("offline"));
    await renderCommissions();

    expect(screen.getByText("Metas Atingidas").parentElement).toHaveTextContent("0 / 0");
  });
});
