import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { fetchPeople } from "@/lib/management";
import { useManagementClients } from "./useManagementClients";

vi.mock("@/lib/management", () => ({ fetchPeople: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));

const people = [
  { cpf: "111", nome: "Ana Cliente", email: "ana@dk.com", telefone: null },
  { cpf: "333", nome: "Carlos Vendedor", email: "carlos@dk.com", telefone: null },
];

describe("useManagementClients", () => {
  beforeEach(() => {
    vi.mocked(fetchPeople).mockResolvedValue({ data: people, meta: { page: 1, limit: 100, total: 2, totalPages: 1 } });
    vi.mocked(api.get).mockResolvedValue({ data: [{ cpf: "333" }] });
  });

  it("carrega as pessoas e remove os funcionários", async () => {
    const { result } = renderHook(() => useManagementClients());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.clients.map((client) => client.nome)).toEqual(["Ana Cliente"]);
    expect(result.current.error).toBeNull();
    expect(api.get).toHaveBeenCalledWith("/employees?limit=100");
  });

  it("informa o erro e recarrega com refetch", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchPeople).mockRejectedValueOnce(new Error("500"));
    const { result } = renderHook(() => useManagementClients());

    await waitFor(() => expect(result.current.error).toBe("Não foi possível carregar os clientes do backend."));
    expect(result.current.clients).toEqual([]);

    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.clients).toHaveLength(1);
  });
});
