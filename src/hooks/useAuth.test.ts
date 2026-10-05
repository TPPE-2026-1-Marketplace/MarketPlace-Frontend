import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./useAuth";

describe("useAuth (hook local)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_LOGIN_CLIENTE", "cliente@dk.com");
    vi.stubEnv("VITE_SENHA_CLIENTE", "segredo");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("começa deslogado sem sessão salva", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("restaura o usuário salvo no localStorage", () => {
    localStorage.setItem("dk_user", JSON.stringify({ id: "9", email: "a@b.com" }));

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual({ id: "9", email: "a@b.com" });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("faz login com as credenciais de demonstração e persiste a sessão", async () => {
    const { result } = renderHook(() => useAuth());

    let response: Awaited<ReturnType<typeof result.current.login>> | undefined;
    await act(async () => {
      response = await result.current.login({ email: "cliente@dk.com", password: "segredo" });
    });

    expect(response?.token).toBe("mock_token");
    expect(result.current.user).toMatchObject({ id: "1", nome: "Cliente Demo" });
    expect(result.current.isAuthenticated).toBe(true);
    expect(JSON.parse(localStorage.getItem("dk_user") ?? "{}").email).toBe("cliente@dk.com");
    expect(localStorage.getItem("dk_token")).toBe("mock_token");
  });

  it("rejeita credenciais inválidas", async () => {
    const { result } = renderHook(() => useAuth());

    await expect(result.current.login({ email: "x", password: "y" })).rejects.toThrow(
      "Credenciais inválidas",
    );
    expect(result.current.user).toBeNull();
  });

  it("registra um novo usuário", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register({ email: "nova@dk.com", nome: "Nova" });
    });

    expect(result.current.user).toEqual({ id: "2", email: "nova@dk.com", nome: "Nova" });
  });

  it("logout limpa usuário e token", async () => {
    localStorage.setItem("dk_user", JSON.stringify({ id: "1", email: "a@b.com" }));
    localStorage.setItem("dk_token", "t");
    const { result } = renderHook(() => useAuth());

    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("dk_user")).toBeNull();
    expect(localStorage.getItem("dk_token")).toBeNull();
  });
});
