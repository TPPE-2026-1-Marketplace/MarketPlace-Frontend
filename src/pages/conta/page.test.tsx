import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { customer, renderWithProviders } from "@/test/render";
import ContaPage from "./page";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
const getMock = vi.mocked(api.get);
const postMock = vi.mocked(api.post);
const patchMock = vi.mocked(api.patch);
const deleteMock = vi.mocked(api.delete);

const profile = { cpf: "12345678900", nome: "Cliente Perfil", email: "perfil@dk.com", telefone: "61999990000" };
const user = { ...customer, id: "12345678900" };

const address = {
  id: 1,
  nome: "Casa",
  principal: true,
  cep: "70000000",
  logradouro: "Rua das Flores",
  numero: "120",
  complemento: null,
  bairro: "Asa Norte",
  cidade: "Brasília",
  uf: "DF",
};

function renderConta(u = user) {
  return renderWithProviders(<ContaPage />, { user: u });
}

function meusDados() {
  return within(screen.getByTestId("meus-dados"));
}

async function startEditing() {
  await meusDados().findByText("Cliente Perfil");
  await userEvent.click(screen.getByRole("button", { name: /Editar/ }));
}

describe("ContaPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    deleteMock.mockReset();
    getMock.mockImplementation((path: string) => {
      if (path.startsWith("/orders")) {
        return Promise.resolve({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
      }
      if (path.startsWith("/addresses")) {
        return Promise.resolve([]);
      }
      return Promise.resolve(profile);
    });
  });

  it("pede login para visitantes", () => {
    renderWithProviders(<ContaPage />);
    expect(screen.getByText("Você precisa estar logada")).toBeInTheDocument();
  });

  it("carrega o perfil do backend e mascara o CPF", async () => {
    renderConta();

    expect(await meusDados().findByText("Cliente Perfil")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith("/people/12345678900");
    expect(screen.getByText("***.***.***-00")).toBeInTheDocument();
    expect(screen.getByText("61999990000")).toBeInTheDocument();
  });

  it("usa os dados da sessão quando o perfil não carrega", async () => {
    getMock.mockImplementationOnce(() => Promise.reject(new Error("404")));
    renderConta({ ...customer, id: "abc" });
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    expect(await meusDados().findByText("Cliente DK")).toBeInTheDocument();
    expect(screen.getAllByText("Não informado")).toHaveLength(3);

    await userEvent.click(screen.getByRole("button", { name: /Editar/ }));
    expect(screen.getByPlaceholderText("Informe seu cpf")).toHaveValue("abc");
    await userEvent.click(screen.getByRole("button", { name: /Salvar/ }));
    expect(screen.getByText(/Sua conta é local/)).toBeInTheDocument();
  });

  it("salva só os campos alterados e atualiza a sessão", async () => {
    patchMock.mockResolvedValueOnce({ ...profile, nome: "Nome Novo", telefone: null });
    renderConta();
    await startEditing();

    await userEvent.click(screen.getByRole("button", { name: /Salvar/ }));
    expect(screen.getByText("Nenhuma alteração detectada.")).toBeInTheDocument();

    const nome = screen.getByPlaceholderText("Informe seu nome");
    await userEvent.clear(nome);
    await userEvent.type(nome, "Nome Novo");
    await userEvent.clear(screen.getByPlaceholderText("Informe seu telefone"));
    await userEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    expect(await screen.findByText("Dados atualizados com sucesso!")).toBeInTheDocument();
    expect(patchMock).toHaveBeenCalledWith("/people/12345678900", { nome: "Nome Novo", telefone: null });
    expect(JSON.parse(localStorage.getItem("dk_user")!).name).toBe("Nome Novo");
    expect(await meusDados().findByText("Nome Novo")).toBeInTheDocument();
  });

  it("cancela a edição restaurando os dados", async () => {
    renderConta();
    await startEditing();
    const email = screen.getByPlaceholderText("Informe seu e-mail");
    await userEvent.clear(email);
    await userEvent.type(email, "outro@dk.com");

    await userEvent.click(screen.getByRole("button", { name: /Cancelar/ }));
    await userEvent.click(screen.getByRole("button", { name: /Editar/ }));
    expect(screen.getByPlaceholderText("Informe seu e-mail")).toHaveValue("perfil@dk.com");
  });

  it.each([
    ["numeric string is expected", "ID de usuário inválido. Faça logout e entre novamente."],
    ["User not found", "Usuário não encontrado. Faça logout e cadastre-se novamente."],
    ["email already exists", "E-mail ou CPF já cadastrado por outro usuário."],
    ["Validation failed", "Dados inválidos. Verifique os campos e tente novamente."],
    ["Outro erro", "Outro erro"],
    ["", "Erro ao atualizar dados. Tente novamente."],
  ])("traduz o erro %j do backend", async (raw, message) => {
    patchMock.mockRejectedValueOnce(new Error(raw));
    renderConta();
    await startEditing();
    await userEvent.type(screen.getByPlaceholderText("Informe seu nome"), "!");

    await userEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("não salva telefone inválido", async () => {
    renderConta();
    await startEditing();

    const telefone = screen.getByPlaceholderText("Informe seu telefone");
    await userEvent.clear(telefone);
    await userEvent.type(telefone, "6100000000");
    expect(telefone).toHaveValue("(61) 0000-0000");
    await userEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    expect(await screen.findByText("Telefone inválido. Use DDD + número, ex.: (61) 99999-0000.")).toBeInTheDocument();
    expect(patchMock).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ telefone: "6100000000" }));
  });

  it("mantém o CPF somente leitura (ele é a chave da conta)", async () => {
    renderConta();
    await startEditing();

    expect(screen.getByPlaceholderText("Informe seu cpf")).toBeDisabled();
    expect(screen.getByPlaceholderText("Informe seu cpf")).toHaveValue("123.456.789-00");
  });

  it("mostra pedidos vazios", async () => {
    renderConta();

    await userEvent.click(screen.getByRole("tab", { name: /Meus pedidos/ }));
    expect(await screen.findByText("Você ainda não tem pedidos.")).toBeInTheDocument();
  });

  it("navega para pedidos e endereços pelos atalhos de Meus Dados", async () => {
    renderConta();
    await meusDados().findByText("Cliente Perfil");

    await userEvent.click(screen.getByRole("button", { name: /Meus endereços →/ }));
    expect(await screen.findByText("Nenhum endereço cadastrado")).toBeInTheDocument();
  });

  describe("Endereços", () => {
    it("mostra vazio e cadastra um novo endereço", async () => {
      renderConta();
      await userEvent.click(screen.getByRole("tab", { name: /Endereços/ }));
      expect(await screen.findByText("Nenhum endereço cadastrado")).toBeInTheDocument();

      postMock.mockResolvedValueOnce(address);
      await userEvent.click(screen.getByRole("button", { name: /Adicionar endereço/ }));
      await userEvent.type(screen.getByLabelText("Nome do endereço"), "Casa");
      await userEvent.type(screen.getByLabelText("CEP"), "70000000");
      await userEvent.type(screen.getByLabelText("Rua"), "Rua das Flores");
      await userEvent.type(screen.getByLabelText("Número"), "120");
      await userEvent.type(screen.getByLabelText("Bairro"), "Asa Norte");
      await userEvent.type(screen.getByLabelText("Cidade"), "Brasília");
      await userEvent.type(screen.getByLabelText("UF"), "df");

      await userEvent.click(screen.getByRole("button", { name: /Salvar endereço/ }));

      await waitFor(() =>
        expect(postMock).toHaveBeenCalledWith(
          "/addresses",
          expect.objectContaining({ nome: "Casa", cep: "70000000", uf: "DF" }),
        ),
      );
    });

    it("lista um endereço existente, edita e remove", async () => {
      getMock.mockImplementation((path: string) => {
        if (path.startsWith("/addresses")) return Promise.resolve([address]);
        return Promise.resolve(profile);
      });
      vi.spyOn(window, "confirm").mockReturnValue(true);
      renderConta();

      await userEvent.click(screen.getByRole("tab", { name: /Endereços/ }));
      expect(await screen.findByText("Casa")).toBeInTheDocument();
      expect(screen.getByText("Principal")).toBeInTheDocument();
      expect(screen.getByText(/Rua das Flores, 120/)).toBeInTheDocument();

      patchMock.mockResolvedValueOnce({ ...address, nome: "Trabalho" });
      await userEvent.click(screen.getByRole("button", { name: /Editar endereço/ }));
      const nomeInput = screen.getByLabelText("Nome do endereço");
      await userEvent.clear(nomeInput);
      await userEvent.type(nomeInput, "Trabalho");
      await userEvent.click(screen.getByRole("button", { name: /Salvar endereço/ }));
      await waitFor(() => expect(patchMock).toHaveBeenCalledWith("/addresses/1", expect.objectContaining({ nome: "Trabalho" })));

      deleteMock.mockResolvedValueOnce(undefined);
      await userEvent.click(screen.getByRole("button", { name: /Remover/ }));
      await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("/addresses/1"));
    });
  });

  describe("Segurança", () => {
    it("troca a senha com sucesso", async () => {
      patchMock.mockResolvedValueOnce({ success: true });
      renderConta();

      await userEvent.click(screen.getByRole("tab", { name: /Segurança/ }));
      await userEvent.click(screen.getByRole("button", { name: /Alterar senha/ }));

      await userEvent.type(screen.getByLabelText("Senha atual"), "atual123");
      await userEvent.type(screen.getByLabelText("Nova senha"), "novaSenha123");
      await userEvent.type(screen.getByLabelText("Confirmar nova senha"), "novaSenha123");
      await userEvent.click(screen.getByRole("button", { name: /Atualizar senha/ }));

      await waitFor(() =>
        expect(patchMock).toHaveBeenCalledWith("/people/12345678900/senha", {
          senhaAtual: "atual123",
          novaSenha: "novaSenha123",
        }),
      );
    });

    it("mostra erro quando a confirmação não bate", async () => {
      renderConta();

      await userEvent.click(screen.getByRole("tab", { name: /Segurança/ }));
      await userEvent.click(screen.getByRole("button", { name: /Alterar senha/ }));

      await userEvent.type(screen.getByLabelText("Senha atual"), "atual123");
      await userEvent.type(screen.getByLabelText("Nova senha"), "novaSenha123");
      await userEvent.type(screen.getByLabelText("Confirmar nova senha"), "outraSenha");
      await userEvent.click(screen.getByRole("button", { name: /Atualizar senha/ }));

      expect(await screen.findByText("A confirmação não bate com a nova senha.")).toBeInTheDocument();
      expect(patchMock).not.toHaveBeenCalled();
    });

    it("confirma a saída pelo modal de Sair da conta", async () => {
      renderConta();

      await userEvent.click(screen.getByRole("tab", { name: /Segurança/ }));
      const segurancaSection = within(screen.getByTestId("meus-seguranca"));
      await userEvent.click(segurancaSection.getByRole("button", { name: "Sair da conta" }));
      await userEvent.click(screen.getByRole("button", { name: "Sair" }));

      expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    });
  });

  it("sai da conta pelo atalho da navegação lateral", async () => {
    renderConta();
    await userEvent.click(screen.getByRole("button", { name: /Sair da conta/ }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });
});
