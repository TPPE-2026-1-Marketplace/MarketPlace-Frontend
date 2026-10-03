import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api";
import { customer, manager, renderWithProviders } from "@/test/render";
import LoginPage from "./page";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn() },
}));
const postMock = vi.mocked(api.post);
const getMock = vi.mocked(api.get);

const jwt = (payload: object) => `h.${btoa(JSON.stringify(payload))}.s`;
const location = () => screen.getByTestId("location").textContent;

describe("LoginPage", () => {
  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
  });

  it("faz login de cliente e vai para a conta", async () => {
    postMock.mockResolvedValueOnce({ access_token: jwt({ sub: "1", role: "cliente", email: "c@dk.com" }) });
    getMock.mockResolvedValueOnce({ nome: "Cliente" });
    renderWithProviders(<LoginPage />, { route: "/login", path: "/login" });

    await userEvent.type(screen.getByPlaceholderText("seu@email.com"), "c@dk.com");
    await userEvent.type(screen.getByPlaceholderText("Sua senha"), "senha123");
    await userEvent.click(screen.getAllByRole("button", { name: "Entrar" })[1]);

    await waitFor(() => expect(location()).toBe("/conta"));
  });

  it("mostra erro de credenciais", async () => {
    postMock.mockRejectedValueOnce(new ApiError(401, "Credenciais inválidas"));
    renderWithProviders(<LoginPage />, { route: "/login", path: "/login" });

    await userEvent.type(screen.getByPlaceholderText("seu@email.com"), "c@dk.com");
    await userEvent.type(screen.getByPlaceholderText("Sua senha"), "errada");
    await userEvent.click(screen.getAllByRole("button", { name: "Entrar" })[1]);

    expect(await screen.findByText("Credenciais inválidas")).toBeInTheDocument();
    expect(location()).toBe("/login");
  });

  it("alterna a visibilidade da senha", async () => {
    renderWithProviders(<LoginPage />, { route: "/login", path: "/login" });
    const senha = screen.getByPlaceholderText("Sua senha");
    expect(senha).toHaveAttribute("type", "password");

    await userEvent.click(senha.parentElement!.querySelector("button")!);
    expect(senha).toHaveAttribute("type", "text");
  });

  it("redireciona usuário logado conforme o papel e o retorno", () => {
    const { unmount } = renderWithProviders(<LoginPage />, { route: "/login", path: "/login", user: manager });
    expect(location()).toBe("/selecionar-modulo");
    unmount();

    renderWithProviders(<LoginPage />, { route: "/login?retorno=checkout", path: "/login", user: customer });
    expect(location()).toBe("/checkout");
  });

  it("abre direto no cadastro, formata o CPF e cria a conta", async () => {
    postMock.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("sem auto-login"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithProviders(<LoginPage />, { route: "/login?modo=cadastro", path: "/login" });
    expect(screen.getByText("Crie sua conta e comece a comprar")).toBeInTheDocument();

    const cpf = screen.getByPlaceholderText("000.000.000-00");
    await userEvent.type(cpf, "123");
    expect(cpf).toHaveValue("123");
    await userEvent.type(cpf, "4");
    expect(cpf).toHaveValue("123.4");
    await userEvent.type(cpf, "567");
    expect(cpf).toHaveValue("123.456.7");
    await userEvent.type(cpf, "890099");
    expect(cpf).toHaveValue("123.456.789-00");

    await userEvent.type(screen.getByPlaceholderText("Seu nome"), "Ana");
    await userEvent.type(screen.getByPlaceholderText("seu@email.com"), "ana@dk.com");
    await userEvent.type(screen.getByPlaceholderText("(11) 99999-9999"), "61999990000");
    await userEvent.type(screen.getByPlaceholderText("Sua senha"), "senha1234");
    await userEvent.click(screen.getAllByRole("button", { name: "Criar Conta" })[1]);

    expect(await screen.findByText("Cadastro concluído, mas falha no auto-login.")).toBeInTheDocument();
    expect(postMock).toHaveBeenNthCalledWith(1, "/people/register-user", expect.objectContaining({ cpf: "12345678900" }));
  });

  it("valida o CPF incompleto e mostra sucesso no cadastro completo", async () => {
    renderWithProviders(<LoginPage />, { route: "/login", path: "/login" });
    await userEvent.click(screen.getAllByRole("button", { name: "Criar Conta" })[0]);

    await userEvent.type(screen.getByPlaceholderText("Seu nome"), "Ana");
    await userEvent.type(screen.getByPlaceholderText("000.000.000-00"), "123");
    await userEvent.type(screen.getByPlaceholderText("seu@email.com"), "ana@dk.com");
    await userEvent.type(screen.getByPlaceholderText("Sua senha"), "senha1234");
    await userEvent.click(screen.getAllByRole("button", { name: "Criar Conta" })[1]);
    expect(await screen.findByText("O CPF deve conter exatamente 11 dígitos numéricos.")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();

    postMock.mockResolvedValueOnce({}).mockResolvedValueOnce({ access_token: jwt({ role: "cliente" }) });
    await userEvent.type(screen.getByPlaceholderText("000.000.000-00"), "45678900");
    await userEvent.click(screen.getAllByRole("button", { name: "Criar Conta" })[1]);
    await waitFor(() => expect(location()).toBe("/conta"));
  });
});
