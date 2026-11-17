import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { fetchPeople } from "@/lib/management";
import { ClientExport } from "./ClientExport";

vi.mock("@/lib/management", () => ({ fetchPeople: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));

const people = [
  { cpf: "11122233344", nome: "Ana Cliente", email: "ana@dk.com", telefone: "61999990000" },
  { cpf: "22233344455", nome: 'Bia "Aspas"', email: "bia@dk.com", telefone: null },
  { cpf: "33344455566", nome: "Carlos Vendedor", email: "carlos@dk.com", telefone: null },
];

async function renderLoaded() {
  render(<ClientExport />);
  await screen.findByText("Ana Cliente");
}

const search = () => screen.getByLabelText("Buscar nome, e-mail ou CPF");

describe("ClientExport", () => {
  beforeEach(() => {
    vi.mocked(fetchPeople).mockResolvedValue({ data: people, meta: { page: 1, limit: 100, total: 3, totalPages: 1 } });
    vi.mocked(api.get).mockResolvedValue({ data: [{ cpf: "33344455566" }] });
  });

  it("mostra o estado de carregamento e depois só os clientes, sem os funcionários", async () => {
    render(<ClientExport />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando dados");

    expect(await screen.findByText("Ana Cliente")).toBeInTheDocument();
    expect(screen.queryByText("Carlos Vendedor")).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("exibe indicadores, telefone formatado e CPF mascarado", async () => {
    await renderLoaded();

    expect(screen.getByRole("heading", { name: "Clientes" })).toBeInTheDocument();
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getByText("(61) 99999-0000")).toBeInTheDocument();
    expect(screen.getByText("***.***.***-44")).toBeInTheDocument();
    expect(screen.queryByText("11122233344")).not.toBeInTheDocument();
    expect(screen.getByText("Acesso conforme o perfil do usuário")).toBeInTheDocument();
  });

  it("filtra por nome, e-mail ou CPF ao aplicar os filtros e atualiza o resultado da busca", async () => {
    await renderLoaded();

    await userEvent.type(search(), "BIA@");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.queryByText("Ana Cliente")).not.toBeInTheDocument();
    expect(screen.getByText("Bia \"Aspas\"")).toBeInTheDocument();

    await userEvent.clear(search());
    await userEvent.type(search(), "111.222.333-44");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.getByText("Ana Cliente")).toBeInTheDocument();
    expect(screen.queryByText("Bia \"Aspas\"")).not.toBeInTheDocument();
  });

  it("mostra o estado sem resultados e limpa os filtros", async () => {
    await renderLoaded();

    await userEvent.type(search(), "ninguém");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar CSV" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(screen.getByText("Ana Cliente")).toBeInTheDocument();
    expect(search()).toHaveValue("");
  });

  it("exporta o CSV do resultado atual da busca", async () => {
    const parts: string[] = [];
    vi.stubGlobal("Blob", class {
      constructor(content: string[]) {
        parts.push(content.join(""));
      }
    });
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:csv"), revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await renderLoaded();

    await userEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    expect(screen.getByText("Exportar clientes")).toBeInTheDocument();
    expect(click).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Confirmar exportação" }));

    expect(parts[0]).toContain('"Ana Cliente","ana@dk.com","61999990000","11122233344"');
    expect(parts[0]).toContain('"Bia ""Aspas"""');
    expect(click).toHaveBeenCalled();
    expect(screen.getByText("Exportação preparada")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("não baixa nada ao cancelar a exportação", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await renderLoaded();

    await userEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(click).not.toHaveBeenCalled();
  });

  it("mostra o erro e tenta de novo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchPeople).mockRejectedValueOnce(new Error("500"));
    render(<ClientExport />);

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Não foi possível carregar os clientes do backend.")).toBeInTheDocument();

    await userEvent.click(within(alert).getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Ana Cliente")).toBeInTheDocument();
  });
});
