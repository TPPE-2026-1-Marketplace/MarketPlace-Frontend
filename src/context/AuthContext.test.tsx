import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, api: { get: vi.fn(), post: vi.fn() } };
});
const postMock = vi.mocked(api.post);
const getMock = vi.mocked(api.get);

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

function jwt(payload: Record<string, unknown>) {
  return `header.${btoa(JSON.stringify(payload))}.assinatura`;
}

function setup() {
  return renderHook(() => useAuth(), { wrapper });
}

describe("AuthContext", () => {
  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
  });

  it("exige o AuthProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within AuthProvider");
  });

  it("começa deslogado e descarta sessão corrompida", () => {
    localStorage.setItem("dk_user", "{nao-e-json");

    const { result } = setup();

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isInternalUser).toBe(false);
    expect(localStorage.getItem("dk_user")).toBeNull();
    expect(result.current.users).toHaveLength(5);
  });

  it("restaura a sessão salva e calcula as permissões de gerente", () => {
    localStorage.setItem(
      "dk_user",
      JSON.stringify({ id: "1", name: "G", email: "g@dk.com", role: "manager" }),
    );

    const { result } = setup();

    expect(result.current).toMatchObject({
      isAuthenticated: true,
      isManager: true,
      isSuperAdmin: false,
      isInternalUser: true,
      canEditProducts: true,
      canEditUsers: true,
      canEditStock: true,
      canEditOrders: true,
      canEditCommissions: true,
      canEditBanners: true,
    });
  });

  it.each([
    ["administrador", "superadmin"],
    ["gerente", "manager"],
    ["caixa", "cashier"],
    ["vendedor", "employee"],
    ["cliente", "customer"],
    ["superadmin", "superadmin"],
    ["manager", "manager"],
    ["cashier", "cashier"],
    ["employee", "employee"],
    ["desconhecido", "customer"],
  ])("login mapeia o papel %s do backend para %s", async (backendRole, role) => {
    postMock.mockResolvedValueOnce({
      access_token: jwt({ sub: "12345678900", role: backendRole, email: "u@dk.com" }),
    });
    getMock.mockResolvedValueOnce({ nome: "Usuária", telefone: "61999990000" });
    const { result } = setup();

    let response: { success: boolean; message: string } | undefined;
    await act(async () => {
      response = await result.current.login("digitado@dk.com", "senha");
    });

    expect(response).toEqual({ success: true, message: "Login realizado com sucesso!" });
    expect(postMock).toHaveBeenCalledWith("/auth/login", { email: "digitado@dk.com", senha: "senha" });
    expect(getMock).toHaveBeenCalledWith("/people/12345678900");
    expect(result.current.user).toEqual({
      id: "12345678900",
      name: "Usuária",
      email: "u@dk.com",
      role,
      phone: "61999990000",
    });
    expect(localStorage.getItem("dk_token")).toContain("header.");
  });

  it("login usa os dados do token quando o perfil falha ou o token não tem payload", async () => {
    postMock.mockResolvedValueOnce({ access_token: jwt({ sub: "1", email: "t@dk.com" }) });
    getMock.mockRejectedValueOnce(new Error("404"));
    const { result } = setup();

    await act(async () => {
      await result.current.login("d@dk.com", "s");
    });
    expect(result.current.user).toMatchObject({ name: "t@dk.com", role: "customer", phone: undefined });

    postMock.mockResolvedValueOnce({ access_token: "token-invalido" });
    await act(async () => {
      await result.current.login("d@dk.com", "s");
    });
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(result.current.user).toMatchObject({ id: "", name: "d@dk.com", email: "d@dk.com" });
  });

  it("login devolve a mensagem da API ou erro de conexão", async () => {
    const { result } = setup();

    postMock.mockRejectedValueOnce(new ApiError(401, "E-mail ou senha inválidos"));
    await expect(result.current.login("a", "b")).resolves.toEqual({
      success: false,
      message: "E-mail ou senha inválidos",
    });

    postMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(result.current.login("a", "b")).resolves.toEqual({
      success: false,
      message: "Erro de conexão com o servidor. Tente novamente mais tarde.",
    });
  });

  it("register cria a conta, limpa o CPF e faz login automático", async () => {
    postMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ access_token: jwt({ role: "cliente" }) });
    const { result } = setup();

    let response: { success: boolean; message: string } | undefined;
    await act(async () => {
      response = await result.current.register("Ana", "ana@dk.com", "123", "", "123.456.789-00");
    });

    expect(response).toEqual({ success: true, message: "Cadastro realizado com sucesso!" });
    expect(postMock).toHaveBeenNthCalledWith(1, "/people/register-user", {
      nome: "Ana",
      email: "ana@dk.com",
      senha: "123",
      telefone: undefined,
      cpf: "12345678900",
    });
    expect(result.current.user).toEqual({
      id: "12345678900",
      name: "Ana",
      email: "ana@dk.com",
      role: "customer",
      phone: undefined,
    });
  });

  it("register informa falha no login automático", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    postMock.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("login caiu"));
    const { result } = setup();

    await expect(result.current.register("A", "a@dk.com", "1", "61", "")).resolves.toEqual({
      success: false,
      message: "Cadastro concluído, mas falha no auto-login.",
    });
  });

  it.each([
    [new ApiError(409, "Conflict"), "E-mail ou CPF já cadastrado."],
    [new ApiError(400, "Dados inválidos"), "Dados inválidos"],
    [
      new ApiError(400, "Bad", { errors: [{ message: "CPF inválido" }, { message: "Senha curta" }] }),
      "CPF inválido, Senha curta",
    ],
    [new ApiError(400, ""), "Dados inválidos. Verifique os campos."],
    [new ApiError(500, "Erro"), "Erro ao criar conta."],
    [new TypeError("offline"), "Erro de conexão com o servidor ao tentar realizar o cadastro."],
  ])("register trata o erro %o", async (error, message) => {
    postMock.mockRejectedValueOnce(error);
    const { result } = setup();

    await expect(result.current.register("A", "a@dk.com", "1", "", "1")).resolves.toEqual({
      success: false,
      message,
    });
  });

  it("logout limpa a sessão e dispara o evento clear-cart", () => {
    localStorage.setItem("dk_user", JSON.stringify({ id: "1", name: "A", email: "a", role: "customer" }));
    localStorage.setItem("dk_token", "t");
    const listener = vi.fn();
    window.addEventListener("clear-cart", listener);
    const { result } = setup();

    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("dk_token")).toBeNull();
    expect(localStorage.getItem("dk_user")).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("clear-cart", listener);
  });

  it("gerencia usuários internos", () => {
    localStorage.setItem(
      "dk_user",
      JSON.stringify({ id: "u-001", name: "Super", email: "superadmin@dkfestas.com.br", role: "superadmin" }),
    );
    const { result } = setup();

    expect(
      result.current.addUser({
        name: "Dup",
        email: "gerente@dkfestas.com.br",
        password: "x",
        role: "employee",
        active: true,
      }),
    ).toEqual({ success: false, message: "E-mail já cadastrado." });

    act(() => {
      expect(
        result.current.addUser({ name: "Nova", email: "nova@dk.com", password: "x", role: "cashier", active: true }),
      ).toEqual({ success: true, message: "Usuário cadastrado com sucesso!" });
    });
    const nova = result.current.users.find((u) => u.email === "nova@dk.com");
    expect(nova).toMatchObject({ role: "cashier", createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });

    act(() => {
      result.current.updateUser(nova!.id, { name: "Nova Caixa" });
    });
    expect(result.current.users.find((u) => u.id === nova!.id)?.name).toBe("Nova Caixa");

    expect(result.current.deleteUser("u-001")).toEqual({
      success: false,
      message: "Não é possível remover o próprio usuário.",
    });
    act(() => {
      result.current.deleteUser(nova!.id);
    });
    expect(result.current.users.some((u) => u.id === nova!.id)).toBe(false);
  });

  it.each([
    ["employee", { isEmployee: true, isManager: false, isInternalUser: true }],
    ["cashier", { isCashier: true, isManager: false, isInternalUser: true }],
    ["superadmin", { isSuperAdmin: true, isManager: true }],
    ["customer", { isInternalUser: false, canEditProducts: false }],
  ])("define as flags do papel %s", (role, flags) => {
    localStorage.setItem("dk_user", JSON.stringify({ id: "1", name: "X", email: "x", role }));
    const { result } = setup();
    expect(result.current).toMatchObject(flags);
  });
});
