import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "../../lib/api";
import { manager, renderWithProviders, superadmin } from "@/test/render";
import { Employees, mapFrontendToRole, mapRoleToFrontend } from "./Employees";

vi.mock("../../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
const getMock = vi.mocked(api.get);
const postMock = vi.mocked(api.post);
const patchMock = vi.mocked(api.patch);

const person = (cpf: string, nome: string, telefone: string | null = null) => ({ cpf, nome, email: `${cpf}@dk.com`, telefone });
const staff = [
  { cpf: "333", ativo: true, role_perfil: "administrador", taxa_comissao: 0, meta_vendas: null, codigo_funcionario: null, person: person("333", "Super DK") },
  { cpf: "11111111111", ativo: true, role_perfil: "vendedor", taxa_comissao: "0.05", meta_vendas: "20000", codigo_funcionario: "ANA01", person: person("11111111111", "Ana Vendas", "61999990000") },
  { cpf: "22222222222", ativo: false, role_perfil: "gerente", taxa_comissao: 0, meta_vendas: null, codigo_funcionario: null, person: person("22222222222", "Gerente Antigo") },
  { cpf: "44444444444", ativo: true, role_perfil: "caixa", taxa_comissao: 0, meta_vendas: null, codigo_funcionario: null, person: person("44444444444", "Caixa Loja") },
  { cpf: "55555555555", ativo: true, role_perfil: "cliente", taxa_comissao: 0, meta_vendas: null, codigo_funcionario: null, person: person("55555555555", "Cliente Final") },
];

const rows = () => screen.getAllByRole("row").slice(1);
const input = (placeholder: string) => screen.getByPlaceholderText(placeholder);

async function renderEmployees(user = superadmin) {
  renderWithProviders(<Employees />, { user });
  await screen.findByText("Ana Vendas");
}

describe("mapeamento de papéis", () => {
  it("converte entre os papéis do backend e do frontend", () => {
    expect(["administrador", "gerente", "caixa", "cliente", "vendedor"].map(mapRoleToFrontend)).toEqual([
      "superadmin", "manager", "cashier", "customer", "employee",
    ]);
    expect((["superadmin", "manager", "cashier", "customer", "employee"] as const).map(mapFrontendToRole)).toEqual([
      "administrador", "gerente", "caixa", "cliente", "vendedor",
    ]);
  });
});

describe("Employees", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    getMock.mockResolvedValue({ data: staff });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("super admin vê a equipe, sem clientes, e filtra por perfil", async () => {
    await renderEmployees();

    expect(screen.getByText("1 funcionário(s) · 0 gerente(s) · 1 caixa(s)")).toBeInTheDocument();
    expect(screen.queryByText("Cliente Final")).not.toBeInTheDocument();
    expect(rows()).toHaveLength(4);
    // o próprio usuário (cpf 333) não pode ser desativado
    expect(within(rows()[0]).queryByTitle("Desativar")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Funcionário" }));
    expect(rows()).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Gerente" }));
    expect(screen.getByText("Gerente Antigo")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Todos" }));
    expect(rows()).toHaveLength(4);
  });

  it("gerente não vê super admins nem pode criá-los", async () => {
    await renderEmployees(manager);

    expect(screen.queryByText("Super DK")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Super Admin" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Novo Usuário/ }));
    expect(within(screen.getByRole("combobox")).getAllByRole("option").map((o) => o.textContent)).toEqual(["Funcionário", "Caixa"]);
  });

  it("mostra os detalhes de um vendedor", async () => {
    await renderEmployees();

    await userEvent.click(within(rows()[1]).getByTitle("Ver detalhes"));
    expect(screen.getByRole("heading", { name: "Ana Vendas" })).toBeInTheDocument();
    expect(screen.getByText("Taxa:").parentElement).toHaveTextContent("5%");
    expect(screen.getByText("Meta:").parentElement).toHaveTextContent("R$ 20.000");
    await userEvent.click(within(rows()[1]).getByTitle("Ver detalhes"));
    expect(screen.queryByRole("heading", { name: "Ana Vendas" })).not.toBeInTheDocument();

    await userEvent.click(within(rows()[2]).getByTitle("Ver detalhes"));
    expect(screen.getByText("Telefone:").parentElement).toHaveTextContent("—");
    await userEvent.click(screen.getByRole("heading", { name: "Gerente Antigo" }).nextElementSibling as HTMLElement);
    expect(screen.queryByRole("heading", { name: "Gerente Antigo" })).not.toBeInTheDocument();
  });

  it("valida o formulário de cadastro", async () => {
    await renderEmployees();
    await userEvent.click(screen.getByRole("button", { name: /Novo Usuário/ }));
    const salvar = screen.getByRole("button", { name: /Cadastrar Usuário/ });

    await userEvent.click(salvar);
    expect(screen.getByText("Preencha todos os campos obrigatórios.")).toBeInTheDocument();

    await userEvent.type(input("000.000.000-00"), "123");
    await userEvent.type(input("Ex: Ana Silva"), "Nova");
    await userEvent.type(input("usuario@dkfestas.com.br"), "nova@dk.com");
    await userEvent.type(input("Senha de acesso"), "segredo");
    await userEvent.click(salvar);
    expect(screen.getByText("CPF deve conter exatamente 11 dígitos numéricos.")).toBeInTheDocument();

    await userEvent.type(input("000.000.000-00"), "45678900");
    expect(input("000.000.000-00")).toHaveValue("123.456.789-00");
    await userEvent.click(salvar);
    expect(screen.getByText("Código do vendedor é obrigatório para funcionários.")).toBeInTheDocument();
  });

  it("cadastra um vendedor com comissão e volta para a lista", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    postMock.mockResolvedValueOnce({});
    await renderEmployees();
    await userEvent.click(screen.getByRole("button", { name: /Novo Usuário/ }));

    await userEvent.type(input("000.000.000-00"), "12345678900");
    await userEvent.type(input("Ex: Ana Silva"), "Nova");
    await userEvent.type(input("usuario@dkfestas.com.br"), "nova@dk.com");
    const senha = input("Senha de acesso");
    await userEvent.type(senha, "segredo");
    await userEvent.click(senha.nextElementSibling as HTMLElement);
    expect(senha).toHaveAttribute("type", "text");
    await userEvent.type(input("(11) 99999-0000"), "61988887777");
    await userEvent.type(input("Ex: ANA01"), "nova01");
    await userEvent.click(screen.getByLabelText(/Programa de bônus/));
    await userEvent.click(screen.getByRole("button", { name: /Cadastrar Usuário/ }));

    expect(postMock).toHaveBeenCalledWith("/employees", {
      cpf: "12345678900",
      nome: "Nova",
      email: "nova@dk.com",
      senha: "segredo",
      telefone: "61988887777",
      ativo: true,
      role_perfil: "vendedor",
      taxa_comissao: 0.05,
      meta_vendas: 20000,
      codigo_funcionario: "NOVA01",
    });
    expect(await screen.findByText("Usuário cadastrado com sucesso!")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledTimes(2);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText("Usuário cadastrado com sucesso!")).not.toBeInTheDocument();
  });

  it("edita um caixa sem enviar comissão nem senha", async () => {
    patchMock.mockResolvedValueOnce({});
    await renderEmployees();

    await userEvent.click(within(rows()[3]).getByTitle("Editar"));
    expect(screen.getByRole("heading", { name: "Editar: Caixa Loja" })).toBeInTheDocument();
    expect(input("000.000.000-00")).toBeDisabled();
    expect(screen.queryByText("Configurações de Comissão")).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Usuário ativo"));
    await userEvent.click(screen.getByRole("button", { name: /Salvar Alterações/ }));

    expect(patchMock).toHaveBeenCalledWith("/employees/44444444444", expect.objectContaining({
      ativo: false,
      role_perfil: "caixa",
      taxa_comissao: undefined,
    }));
    expect(patchMock.mock.calls[0][1]).not.toHaveProperty("senha");
    expect(await screen.findByText("Usuário atualizado com sucesso!")).toBeInTheDocument();
  });

  it("mostra o erro da API ao salvar e cancela o formulário", async () => {
    patchMock.mockRejectedValueOnce(new ApiError(409, "E-mail em uso"));
    await renderEmployees();

    await userEvent.click(within(rows()[1]).getByTitle("Editar"));
    await userEvent.selectOptions(screen.getByRole("combobox"), "manager");
    await userEvent.click(screen.getByRole("button", { name: /Salvar Alterações/ }));
    expect(await screen.findByText("E-mail em uso")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("heading", { name: /Editar:/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Novo Usuário/ }));
    await userEvent.click(screen.getByRole("heading", { name: "Novo Usuário" }).nextElementSibling as HTMLElement);
    expect(screen.queryByRole("heading", { name: "Novo Usuário" })).not.toBeInTheDocument();
  });

  it("desativa um usuário após confirmação", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    patchMock.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("500"));
    await renderEmployees();

    await userEvent.click(within(rows()[1]).getByTitle("Desativar"));
    expect(patchMock).not.toHaveBeenCalled();
    await userEvent.click(within(rows()[1]).getByTitle("Desativar"));
    expect(confirm).toHaveBeenLastCalledWith("Desativar Ana Vendas?");
    expect(patchMock).toHaveBeenCalledWith("/employees/11111111111", { ativo: false });
    expect(await screen.findByText("Usuário desativado com sucesso.")).toBeInTheDocument();

    await userEvent.click(within(rows()[3]).getByTitle("Desativar"));
    expect(await screen.findByText("Erro ao desativar o usuário.")).toBeInTheDocument();
  });

  it("avisa quando a lista não carrega", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getMock.mockRejectedValueOnce(new Error("offline"));
    renderWithProviders(<Employees />, { user: superadmin });

    expect(await screen.findByText("Erro ao carregar funcionários.")).toBeInTheDocument();
  });
});
