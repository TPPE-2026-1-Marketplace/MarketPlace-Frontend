import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { apiRouter } from "@/test/apiRouter";
import { manager, renderWithProviders, superadmin } from "@/test/render";
import { Commissions } from "./Commissions";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
const getMock = vi.mocked(api.get);
const postMock = vi.mocked(api.post);
const patchMock = vi.mocked(api.patch);

const NOW = new Date("2026-10-27T12:00:00");

const person = (nome: string) => ({ nome, email: `${nome}@dk.com`, cpf: "", telefone: null });
const employees = {
  data: [
    { cpf: "111", ativo: true, role_perfil: "vendedor", taxa_comissao: "0.05", meta_vendas: "1000", codigo_funcionario: "ANA01", person: person("Ana Vendas") },
    { cpf: "222", ativo: true, role_perfil: "vendedor", taxa_comissao: "0.04", meta_vendas: "2000", codigo_funcionario: null, person: person("Bruno Loja") },
    { cpf: "333", ativo: true, role_perfil: "vendedor", taxa_comissao: "0.03", meta_vendas: null, codigo_funcionario: null, person: person("Carla Nova") },
    { cpf: "444", ativo: false, role_perfil: "vendedor", taxa_comissao: "0.05", meta_vendas: null, codigo_funcionario: null, person: person("Desligado") },
    { cpf: "555", ativo: true, role_perfil: "gerente", taxa_comissao: 0, meta_vendas: null, codigo_funcionario: null, person: person("Gerente") },
  ],
};

const reports = {
  // Meta batida com bônus de +1,5%: comissão = 1500 × 6,5%.
  "111": {
    total_vendas: 1500,
    comissao: 97.5,
    meta_batida: true,
    meta_vendas: 1000,
    valor_bonus: 0.015,
    pedidos: [
      { idPedido: 84, dataPedido: "2026-10-26T12:00:00", valorTotal: "1000" },
      { idPedido: 79, dataPedido: "2026-10-25T12:00:00", valorTotal: "500" },
    ],
  },
  "222": { total_vendas: 1000, comissao: 40, meta_batida: false, meta_vendas: 2000, valor_bonus: 0.01, pedidos: [] },
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

const rows = () => screen.getAllByRole("row").slice(1);
const row = (name: string) => rows().find((item) => item.textContent?.includes(name)) as HTMLElement;
const kpi = (label: string) => screen.getAllByText(label, { selector: "p" })[0].nextElementSibling;
const dialog = () => within(screen.getByRole("dialog"));

async function renderCommissions(user = superadmin) {
  renderWithProviders(<Commissions now={NOW} />, { user });
  await screen.findByText("Ana Vendas");
}

describe("Commissions", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    backend();
  });

  it("lista os vendedores ativos da competência com indicadores, progresso e bônus em R$", async () => {
    await renderCommissions();

    expect(screen.getByRole("heading", { level: 1, name: "Comissões" })).toBeInTheDocument();
    expect(kpi("Vendas da equipe")).toHaveTextContent("R$ 2.500,00");
    expect(kpi("Comissões")).toHaveTextContent("R$ 137,50");
    expect(kpi("Metas atingidas")).toHaveTextContent("1 de 3");
    expect(kpi("Bônus")).toHaveTextContent("R$ 22,50");
    expect(getMock).toHaveBeenCalledWith("/employees/111/commissions?mes=10&ano=2026");

    expect(rows()).toHaveLength(3);
    expect(rows()[0]).toHaveTextContent("Ana Vendas");
    expect(row("Ana Vendas")).toHaveTextContent("150%");
    expect(row("Ana Vendas")).toHaveTextContent("R$ 22,50");
    expect(row("Bruno Loja")).toHaveTextContent("50%");
    expect(row("Carla Nova")).toHaveTextContent("Sem meta");
    expect(row("Carla Nova")).toHaveTextContent("Indisponível");
    expect(screen.queryByText("Desligado")).not.toBeInTheDocument();
    expect(screen.queryByText("Gerente")).not.toBeInTheDocument();
  });

  it("troca a competência e busca o vendedor", async () => {
    await renderCommissions();

    await userEvent.selectOptions(screen.getByLabelText(/^Competência:/), "2026-09");
    expect(screen.getByLabelText("Competência: setembro / 2026")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/employees/111/commissions?mes=9&ano=2026"));
    await screen.findByText("Ana Vendas");

    await userEvent.type(screen.getByLabelText("Buscar vendedor"), "ana01");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(rows()).toHaveLength(1);

    await userEvent.clear(screen.getByLabelText("Buscar vendedor"));
    await userEvent.type(screen.getByLabelText("Buscar vendedor"), "zzz");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(rows()).toHaveLength(3);
  });

  it("mostra o detalhe e o histórico de vendas com a comissão de cada venda", async () => {
    await renderCommissions();

    await userEvent.click(screen.getByRole("button", { name: "Ver detalhes de Ana Vendas" }));
    expect(dialog().getByRole("heading", { name: "Comissão e meta · Ana Vendas" })).toBeInTheDocument();
    expect(dialog().getByText("Competência").nextElementSibling).toHaveTextContent("Outubro / 2026");
    expect(dialog().getByLabelText("Taxa de comissão (%)")).toHaveValue("5");
    expect(dialog().getByLabelText("Bônus ao bater a meta (%)")).toHaveValue("1,5");
    expect(dialog().getByText("Comissão calculada").nextElementSibling).toHaveTextContent("R$ 97,50");

    await userEvent.click(dialog().getByRole("button", { name: "Histórico de vendas" }));
    expect(dialog().getByRole("heading", { name: "Histórico de vendas · Ana Vendas" })).toBeInTheDocument();
    expect(dialog().getByText("26 out · #PDV-084").nextElementSibling).toHaveTextContent("R$ 1.000,00 · Comissão R$ 50,00");
    await userEvent.click(dialog().getByRole("button", { name: "Voltar às comissões" }));
    expect(dialog().getByRole("heading", { name: "Comissão e meta · Ana Vendas" })).toBeInTheDocument();
    await userEvent.click(dialog().getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Ver detalhes de Bruno Loja" }));
    await userEvent.click(dialog().getByRole("button", { name: "Histórico de vendas" }));
    expect(dialog().getByText("Nenhuma venda presencial nesta competência")).toBeInTheDocument();
  });

  it("salva taxa, meta e bônus como taxas, criando a meta individual da competência", async () => {
    patchMock.mockResolvedValue({});
    postMock.mockResolvedValue({});
    await renderCommissions();

    await userEvent.click(screen.getByRole("button", { name: "Ver detalhes de Ana Vendas" }));
    await userEvent.clear(dialog().getByLabelText("Taxa de comissão (%)"));
    await userEvent.type(dialog().getByLabelText("Taxa de comissão (%)"), "4,5");
    await userEvent.clear(dialog().getByLabelText("Meta de vendas (R$)"));
    await userEvent.type(dialog().getByLabelText("Meta de vendas (R$)"), "12000");
    await userEvent.clear(dialog().getByLabelText("Bônus ao bater a meta (%)"));
    await userEvent.type(dialog().getByLabelText("Bônus ao bater a meta (%)"), "2");
    await userEvent.click(dialog().getByRole("button", { name: "Salvar configuração" }));

    expect(patchMock).toHaveBeenCalledWith("/employees/111", { taxa_comissao: 0.045, meta_vendas: 12000 });
    expect(postMock).toHaveBeenCalledWith("/sales-goals", {
      cpfFuncionario: "111",
      mes: 10,
      ano: 2026,
      valorMeta: 12000,
      valorBonus: 0.02,
    });
    expect(await screen.findByText("Alterações salvas")).toBeInTheDocument();
    expect(dialog().getByText("Resultado").nextElementSibling).toHaveTextContent(
      "Comissão e meta de Ana Vendas salvas para outubro / 2026",
    );
  });

  it("atualiza a meta existente, zera o bônus desligado e avisa quando falha", async () => {
    backend([{ idGoal: 7, cpfFuncionario: "222", mes: 10, ano: 2026, valorMeta: "2000", valorBonus: "0.01" }]);
    patchMock.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("500"));
    await renderCommissions();

    await userEvent.click(screen.getByRole("button", { name: "Ver detalhes de Bruno Loja" }));
    await userEvent.selectOptions(dialog().getByLabelText("Bônus habilitado"), "nao");
    expect(dialog().queryByLabelText("Bônus ao bater a meta (%)")).not.toBeInTheDocument();
    await userEvent.click(dialog().getByRole("button", { name: "Salvar configuração" }));

    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith("/sales-goals/7", expect.objectContaining({ valorBonus: 0 })),
    );
    expect(await dialog().findByRole("alert")).toHaveTextContent("Não foi possível salvar a configuração de comissão.");

    await userEvent.clear(dialog().getByLabelText("Meta de vendas (R$)"));
    await userEvent.type(dialog().getByLabelText("Meta de vendas (R$)"), "-1");
    await userEvent.click(dialog().getByRole("button", { name: "Salvar configuração" }));
    expect(dialog().getByRole("alert")).toHaveTextContent("Informe valores numéricos não negativos.");
  });

  it("configura a meta da equipe da competência", async () => {
    backend([{ idGoal: 1, cpfFuncionario: null, mes: 10, ano: 2026, valorMeta: "50000", valorBonus: "0.01" }]);
    patchMock.mockResolvedValue({});
    await renderCommissions();

    await userEvent.click(screen.getByRole("button", { name: "Configurar metas" }));
    expect(dialog().getByLabelText("Meta de vendas (R$)")).toHaveValue(50000);
    expect(dialog().getByLabelText("Bônus ao bater a meta (%)")).toHaveValue("1");
    await userEvent.clear(dialog().getByLabelText("Meta de vendas (R$)"));
    await userEvent.type(dialog().getByLabelText("Meta de vendas (R$)"), "60000");
    await userEvent.click(dialog().getByRole("button", { name: "Salvar meta" }));

    expect(patchMock).toHaveBeenCalledWith("/sales-goals/1", {
      cpfFuncionario: null,
      mes: 10,
      ano: 2026,
      valorMeta: 60000,
      valorBonus: 0.01,
    });
    expect(await screen.findByText("Meta da equipe salva para outubro / 2026")).toBeInTheDocument();
  });

  it("gerente consulta sem editar e sem buscar as metas", async () => {
    await renderCommissions(manager);

    expect(screen.queryByRole("button", { name: "Configurar metas" })).not.toBeInTheDocument();
    expect(getMock).not.toHaveBeenCalledWith(expect.stringContaining("/sales-goals"));
    await userEvent.click(screen.getByRole("button", { name: "Ver detalhes de Ana Vendas" }));
    expect(dialog().getByText("Bônus ao bater a meta (%)").nextElementSibling).toHaveTextContent("1,5");
    expect(dialog().queryByRole("button", { name: "Salvar configuração" })).not.toBeInTheDocument();
    await userEvent.click(dialog().getByRole("button", { name: "Fechar" }));
  });

  it("mostra o erro de carregamento e tenta de novo", async () => {
    getMock.mockRejectedValueOnce(new Error("offline"));
    renderWithProviders(<Commissions now={NOW} />, { user: superadmin });

    expect(await screen.findByText("Não foi possível carregar os dados")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Ana Vendas")).toBeInTheDocument();
  });
});
