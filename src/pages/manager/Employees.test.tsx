import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api";
import { formatCommissionRate, mapFrontendToRole, mapRoleToFrontend } from "@/lib/employees";
import { manager, renderWithProviders, superadmin } from "@/test/render";
import { Employees } from "./Employees";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
const getMock = vi.mocked(api.get);
const postMock = vi.mocked(api.post);
const patchMock = vi.mocked(api.patch);

const person = (cpf: string, nome: string, telefone: string | null = null) => ({
  cpf,
  nome,
  email: `${cpf}@dk.com`,
  telefone,
});
const staff = [
  { cpf: "333", ativo: true, role_perfil: "administrador", taxa_comissao: 0, meta_vendas: null, codigo_funcionario: null, person: person("333", "Super DK") },
  { cpf: "11111111111", ativo: true, role_perfil: "vendedor", taxa_comissao: "0.05", meta_vendas: "20000", codigo_funcionario: "ANA01", person: person("11111111111", "Ana Vendas", "61999990000") },
  { cpf: "22222222222", ativo: false, role_perfil: "gerente", taxa_comissao: 0, meta_vendas: null, codigo_funcionario: null, person: person("22222222222", "Gerente Antigo") },
  { cpf: "44444444444", ativo: true, role_perfil: "caixa", taxa_comissao: 0, meta_vendas: null, codigo_funcionario: null, person: person("44444444444", "Caixa Loja") },
  { cpf: "55555555555", ativo: true, role_perfil: "cliente", taxa_comissao: 0, meta_vendas: null, codigo_funcionario: null, person: person("55555555555", "Cliente Final") },
];

const rows = () => screen.getAllByRole("row").slice(1);
const kpi = (label: string) => screen.getByText(label, { selector: "p" }).nextElementSibling;
const dialog = () => within(screen.getByRole("dialog"));

async function renderEmployees(user = superadmin) {
  renderWithProviders(<Employees />, { user });
  await screen.findByText("Ana Vendas");
}

async function applyFilters(values: { search?: string; role?: string; status?: string }) {
  const search = screen.getByLabelText("Buscar nome, e-mail ou CPF");
  await userEvent.clear(search);
  if (values.search) await userEvent.type(search, values.search);
  await userEvent.selectOptions(screen.getByLabelText(/^Perfil:/), values.role ?? "all");
  await userEvent.selectOptions(screen.getByLabelText(/^Status:/), values.status ?? "all");
  await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
}

describe("papéis da equipe", () => {
  it("converte entre os papéis do backend e do frontend e formata a comissão", () => {
    expect(["administrador", "gerente", "caixa", "cliente", "vendedor"].map(mapRoleToFrontend)).toEqual([
      "superadmin", "manager", "cashier", "customer", "employee",
    ]);
    expect((["superadmin", "manager", "cashier", "customer", "employee"] as const).map(mapFrontendToRole)).toEqual([
      "administrador", "gerente", "caixa", "cliente", "vendedor",
    ]);
    expect(formatCommissionRate("0.05")).toBe("5%");
    expect(formatCommissionRate(0.035)).toBe("3,5%");
  });
});

describe("Employees", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    getMock.mockResolvedValue({ data: staff });
  });

  it("administrador vê a equipe ativa, sem clientes, com indicadores e filtros", async () => {
    await renderEmployees();

    expect(screen.getByRole("heading", { level: 1, name: "Usuários" })).toBeInTheDocument();
    expect(kpi("Funcionários")).toHaveTextContent("01");
    expect(kpi("Gerentes")).toHaveTextContent("00");
    expect(kpi("Caixas")).toHaveTextContent("01");
    expect(kpi("Ativos")).toHaveTextContent("03");

    // Abre em "Status: ativos": o gerente inativo e o cliente ficam de fora.
    expect(rows()).toHaveLength(3);
    expect(screen.queryByText("Cliente Final")).not.toBeInTheDocument();
    expect(screen.getByText("Super DK (você)")).toBeInTheDocument();
    const ana = rows().find((row) => row.textContent?.includes("Ana Vendas")) as HTMLElement;
    expect(ana).toHaveTextContent("Vendedor");
    expect(ana).toHaveTextContent("ANA01");
    expect(ana).toHaveTextContent("5%");

    await applyFilters({ status: "inactive" });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent("Gerente Antigo");

    await applyFilters({ role: "cashier" });
    expect(rows()).toHaveLength(1);
    expect(screen.getByLabelText("Perfil: caixa")).toBeInTheDocument();

    await applyFilters({ search: "11111" });
    expect(rows()).toHaveLength(1);

    await applyFilters({ search: "ninguém" });
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(rows()).toHaveLength(4);
  });

  it("gerente só consulta: não vê administradores nem ações de edição", async () => {
    await renderEmployees(manager);

    expect(screen.queryByText("Super DK")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Novo usuário" })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText(/^Perfil:/)).queryByRole("option", { name: "Administrador" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ver usuário Ana Vendas" }));
    expect(dialog().getByText("CPF *").nextElementSibling).toHaveTextContent("***.***.***-11");
    expect(dialog().getByText("Telefone").nextElementSibling).toHaveTextContent("(61) 99999-0000");
    expect(dialog().getByText("Meta de vendas (R$)").nextElementSibling).toHaveTextContent("20.000");
    expect(dialog().queryByRole("button", { name: "Salvar usuário" })).not.toBeInTheDocument();
    expect(dialog().queryByRole("button", { name: "Desativar usuário" })).not.toBeInTheDocument();
    await userEvent.click(dialog().getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("valida o cadastro novo", async () => {
    await renderEmployees();
    await userEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    expect(dialog().getByRole("heading", { name: "Novo usuário" })).toBeInTheDocument();
    const salvar = dialog().getByRole("button", { name: "Salvar usuário" });

    await userEvent.click(salvar);
    expect(dialog().getByRole("alert")).toHaveTextContent("Preencha todos os campos obrigatórios.");

    await userEvent.type(dialog().getByLabelText("CPF *"), "123");
    await userEvent.type(dialog().getByLabelText("Nome completo *"), "Nova");
    await userEvent.type(dialog().getByLabelText("E-mail *"), "nova@dk.com");
    await userEvent.type(dialog().getByLabelText("Senha *"), "segredo");
    await userEvent.click(salvar);
    expect(dialog().getByRole("alert")).toHaveTextContent("CPF deve conter exatamente 11 dígitos numéricos.");

    await userEvent.type(dialog().getByLabelText("CPF *"), "45678900");
    expect(dialog().getByLabelText("CPF *")).toHaveValue("123.456.789-00");
    await userEvent.click(salvar);
    expect(dialog().getByRole("alert")).toHaveTextContent("CPF inválido. Confira os números digitados.");

    await userEvent.clear(dialog().getByLabelText("CPF *"));
    await userEvent.type(dialog().getByLabelText("CPF *"), "52998224725");
    await userEvent.type(dialog().getByLabelText("Telefone"), "00123");
    await userEvent.click(salvar);
    expect(dialog().getByRole("alert")).toHaveTextContent("Telefone inválido");

    await userEvent.clear(dialog().getByLabelText("Telefone"));
    await userEvent.click(salvar);
    expect(dialog().getByRole("alert")).toHaveTextContent("Código de vendedor é obrigatório para vendedores.");
    expect(postMock).not.toHaveBeenCalled();
  });

  it("cadastra um vendedor com comissão e mostra a confirmação", async () => {
    postMock.mockResolvedValueOnce({});
    await renderEmployees();
    await userEvent.click(screen.getByRole("button", { name: "Novo usuário" }));

    await userEvent.type(dialog().getByLabelText("CPF *"), "52998224725");
    await userEvent.type(dialog().getByLabelText("Nome completo *"), "Nova Vendedora");
    await userEvent.type(dialog().getByLabelText("E-mail *"), "nova@dk.com");
    await userEvent.type(dialog().getByLabelText("Senha *"), "segredo123");
    await userEvent.type(dialog().getByLabelText("Telefone"), "61988887777");
    await userEvent.type(dialog().getByLabelText("Código de vendedor"), "nov01");
    await userEvent.clear(dialog().getByLabelText("Comissão (%)"));
    await userEvent.type(dialog().getByLabelText("Comissão (%)"), "7");
    await userEvent.click(dialog().getByRole("button", { name: "Salvar usuário" }));

    expect(postMock).toHaveBeenCalledWith("/employees", {
      cpf: "52998224725",
      nome: "Nova Vendedora",
      email: "nova@dk.com",
      senha: "segredo123",
      telefone: "61988887777",
      ativo: true,
      role_perfil: "vendedor",
      taxa_comissao: 0.07,
      meta_vendas: 10000,
      codigo_funcionario: "NOV01",
    });
    expect(await screen.findByText("Alterações salvas")).toBeInTheDocument();
    expect(dialog().getByText("Resultado").nextElementSibling).toHaveTextContent("Usuário Nova Vendedora cadastrado");
    await userEvent.click(dialog().getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("edita um caixa sem enviar comissão, senha nem telefone inalterado", async () => {
    patchMock.mockResolvedValueOnce({});
    await renderEmployees();

    await userEvent.click(screen.getByRole("button", { name: "Editar usuário Caixa Loja" }));
    expect(dialog().getByRole("heading", { name: "Usuário · Caixa Loja" })).toBeInTheDocument();
    expect(dialog().queryByLabelText("Comissão (%)")).not.toBeInTheDocument();
    await userEvent.clear(dialog().getByLabelText("Nome completo *"));
    await userEvent.type(dialog().getByLabelText("Nome completo *"), "Caixa Central");
    await userEvent.click(dialog().getByRole("button", { name: "Salvar usuário" }));

    expect(patchMock).toHaveBeenCalledWith(
      "/employees/44444444444",
      expect.objectContaining({ nome: "Caixa Central", role_perfil: "caixa", taxa_comissao: undefined }),
    );
    const payload = patchMock.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("senha");
    expect(payload).not.toHaveProperty("cpf");
    expect(payload.telefone).toBeUndefined();
    expect(await screen.findByText("Usuário Caixa Central atualizado")).toBeInTheDocument();
  });

  it("envia telefone null ao esvaziar o campo e mostra o erro da API", async () => {
    patchMock.mockRejectedValueOnce(new ApiError(409, "E-mail em uso"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await renderEmployees();

    await userEvent.click(screen.getByRole("button", { name: "Editar usuário Ana Vendas" }));
    expect(dialog().getByLabelText("Telefone")).toHaveValue("(61) 99999-0000");
    await userEvent.clear(dialog().getByLabelText("Telefone"));
    await userEvent.click(dialog().getByRole("button", { name: "Salvar usuário" }));

    expect((patchMock.mock.calls[0][1] as { telefone?: string | null }).telefone).toBeNull();
    expect(await dialog().findByRole("alert")).toHaveTextContent("E-mail em uso");
    await userEvent.click(dialog().getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("desativa um usuário após confirmação, mas não o próprio administrador", async () => {
    patchMock.mockResolvedValueOnce({});
    await renderEmployees();

    await userEvent.click(screen.getByRole("button", { name: "Editar usuário Super DK" }));
    expect(dialog().queryByRole("button", { name: "Desativar usuário" })).not.toBeInTheDocument();
    await userEvent.click(dialog().getByRole("button", { name: "Cancelar" }));

    await userEvent.click(screen.getByRole("button", { name: "Editar usuário Ana Vendas" }));
    await userEvent.click(dialog().getByRole("button", { name: "Desativar usuário" }));
    expect(dialog().getByRole("heading", { name: "Desativar usuário" })).toBeInTheDocument();
    await userEvent.click(dialog().getByRole("button", { name: "Voltar" }));
    expect(patchMock).not.toHaveBeenCalled();

    await userEvent.click(dialog().getByRole("button", { name: "Desativar usuário" }));
    await userEvent.click(dialog().getByRole("button", { name: "Desativar" }));
    expect(patchMock).toHaveBeenCalledWith("/employees/11111111111", { ativo: false });
    expect(await screen.findByText("Usuário Ana Vendas desativado")).toBeInTheDocument();
  });

  it("mostra o erro de carregamento e tenta de novo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getMock.mockRejectedValueOnce(new Error("offline"));
    renderWithProviders(<Employees />, { user: superadmin });

    expect(await screen.findByText("Não foi possível carregar os dados")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Ana Vendas")).toBeInTheDocument();
  });
});
