import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { fetchProducts } from "@/lib/catalog";
import { makeProduct, makeVariant } from "@/test/factories";
import { customer, renderWithProviders } from "@/test/render";
import ContaPage from "./page";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), patch: vi.fn() },
}));
vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  fetchProducts: vi.fn(),
}));
const getMock = vi.mocked(api.get);
const patchMock = vi.mocked(api.patch);

const profile = { cpf: "12345678900", nome: "Cliente Perfil", email: "perfil@dk.com", telefone: "61999990000" };
const user = { ...customer, id: "12345678900" };

function renderConta(u = user) {
  return renderWithProviders(<ContaPage />, { user: u });
}

async function startEditing() {
  await screen.findByText("Cliente Perfil", { selector: "h1" });
  await userEvent.click(screen.getByRole("button", { name: /Editar/ }));
}

describe("ContaPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    patchMock.mockReset();
    getMock.mockResolvedValue(profile);
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [
        makeProduct({ idProduto: 1, titulo: "Vestido Salvo" }),
        makeProduct({ idProduto: 2, titulo: "Vestido Sem Foto", categories: [], variants: [makeVariant({ images: [] })] }),
      ],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });
  });

  it("pede login para visitantes", () => {
    renderWithProviders(<ContaPage />);
    expect(screen.getByText("Você precisa estar logada")).toBeInTheDocument();
  });

  it("carrega o perfil do backend e mascara o CPF", async () => {
    renderConta();

    expect(await screen.findByText("Cliente Perfil", { selector: "h1" })).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith("/people/12345678900");
    expect(screen.getByText("***.***.***-00")).toBeInTheDocument();
    expect(screen.getByText("61999990000")).toBeInTheDocument();
  });

  it("usa os dados da sessão quando o perfil não carrega", async () => {
    getMock.mockRejectedValueOnce(new Error("404"));
    renderConta({ ...customer, id: "abc" });
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    expect(screen.getByText("Cliente DK", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getAllByText("Não informado")).toHaveLength(2);

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
    expect(patchMock).toHaveBeenCalledWith("/people/12345678900", { nome: "Nome Novo", telefone: undefined });
    expect(JSON.parse(localStorage.getItem("dk_user")!).name).toBe("Nome Novo");
    expect(screen.getByText("Nome Novo", { selector: "h1" })).toBeInTheDocument();
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

  it("mostra pedidos vazios e os favoritos com link para o produto", async () => {
    localStorage.setItem("dk_favorites", JSON.stringify(["1", "2"]));
    renderConta();

    await userEvent.click(screen.getByRole("button", { name: /Meus Pedidos/ }));
    expect(screen.getByText("Você ainda não tem pedidos.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Favoritos/ }));
    expect(await screen.findByText("Vestido Salvo")).toBeInTheDocument();
    expect(screen.getByText("Vestido Salvo").closest("a")).toHaveAttribute("href", "/produtos/1");
    expect(screen.getByText("Vestido")).toBeInTheDocument();
    expect(screen.getByAltText("Vestido Sem Foto")).toHaveAttribute("src", "/hero-dress.png");
  });

  it("mostra favoritos vazios e sai da conta", async () => {
    renderConta();
    await userEvent.click(screen.getByRole("button", { name: /Favoritos/ }));
    expect(screen.getByText("Nenhum favorito ainda")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Sair/ }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });
});
