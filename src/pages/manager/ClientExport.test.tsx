import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { fetchPeople } from "@/lib/management";
import { ClientExport } from "./ClientExport";

vi.mock("@/lib/management", () => ({ fetchPeople: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));

const people = [
  { cpf: "111", nome: "Ana Cliente", email: "ana@dk.com", telefone: "61 9999", },
  { cpf: "222", nome: 'Bia "Aspas"', email: "bia@dk.com", telefone: null },
  { cpf: "333", nome: "Carlos Vendedor", email: "carlos@dk.com", telefone: null },
];

describe("ClientExport", () => {
  beforeEach(() => {
    vi.mocked(fetchPeople).mockResolvedValue({ data: people, meta: { page: 1, limit: 100, total: 3, totalPages: 1 } });
    vi.mocked(api.get).mockResolvedValue({ data: [{ cpf: "333" }] });
  });

  it("lista só clientes, sem os funcionários", async () => {
    render(<ClientExport />);
    expect(screen.getByText("Carregando clientes...")).toBeInTheDocument();

    expect(await screen.findByText("Ana Cliente")).toBeInTheDocument();
    expect(screen.queryByText("Carlos Vendedor")).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/employees?limit=100");
  });

  it("filtra por nome, e-mail ou CPF", async () => {
    render(<ClientExport />);
    await screen.findByText("Ana Cliente");
    const search = screen.getByPlaceholderText("Buscar por nome, e-mail ou CPF...");

    await userEvent.type(search, "BIA@");
    expect(screen.queryByText("Ana Cliente")).not.toBeInTheDocument();
    await userEvent.clear(search);
    await userEvent.type(search, "111");
    expect(screen.getByText("Ana Cliente")).toBeInTheDocument();
    await userEvent.type(search, "x");
    expect(screen.getByText("Nenhum cliente real encontrado.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar CSV/ })).toBeDisabled();
  });

  it("exporta o CSV com aspas escapadas", async () => {
    // O Blob do jsdom não implementa text(): guarda o conteúdo passado ao construtor.
    const csvParts: string[] = [];
    vi.stubGlobal("Blob", class {
      constructor(parts: string[]) {
        csvParts.push(parts.join(""));
      }
    });
    const createObjectURL = vi.fn(() => "blob:csv");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<ClientExport />);
    await screen.findByText("Ana Cliente");

    await userEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(csvParts[0]).toBe(
      '"nome","email","telefone","cpf"\n"Ana Cliente","ana@dk.com","61 9999","111"\n"Bia ""Aspas""","bia@dk.com","","222"',
    );
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:csv");
  });

  it("mostra erro quando o backend falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchPeople).mockRejectedValueOnce(new Error("500"));
    render(<ClientExport />);

    expect(await screen.findByText("Não foi possível carregar os clientes do backend.")).toBeInTheDocument();
  });
});
