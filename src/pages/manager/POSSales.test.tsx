import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../lib/api";
import { fetchManagementOrders, type ApiOrder } from "../../lib/management";
import { POSSales } from "./POSSales";

vi.mock("../../lib/api", () => ({ api: { get: vi.fn() } }));
vi.mock("../../lib/management", () => ({ fetchManagementOrders: vi.fn() }));

const employees = [
  { cpf: "111", ativo: true, role_perfil: "vendedor", codigo_funcionario: "ANA01", person: { cpf: "111", nome: "Ana Vendas" } },
  { cpf: "222", ativo: true, role_perfil: "vendedor", codigo_funcionario: null, person: { cpf: "222", nome: "Bruno Loja" } },
  { cpf: "333", ativo: true, role_perfil: "gerente", codigo_funcionario: "GER", person: { cpf: "333", nome: "Gerente" } },
];

function sale(idPedido: number, idFuncionario: string | undefined, valorTotal: string, extra: Partial<ApiOrder> = {}): ApiOrder {
  return {
    idPedido,
    idUsuario: null,
    idFuncionario,
    dataPedido: "2026-09-12T12:00:00",
    status: "paid",
    subtotal: valorTotal,
    valorFrete: 0,
    valorTotal,
    tipoRetirada: "loja",
    codigoRastreamento: null,
    items: [{ idItemPedido: 1, idVariante: "X", quantidade: 2, precoUnitario: 1 }],
    ...extra,
  };
}

const rows = () => screen.getAllByRole("row").slice(1);

describe("POSSales", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({ data: employees });
    vi.mocked(fetchManagementOrders).mockResolvedValue({
      data: [
        sale(1, "ANA01", "100", { clienteNomeAvulso: "Maria" }),
        sale(2, "222", "300"),
        sale(3, undefined, "50", { user: { nome: "Cliente App" } }),
        sale(4, "111", "999", { tipoRetirada: "entrega" }),
      ],
      meta: { page: 1, limit: 100, total: 4, totalPages: 1 },
    });
  });

  it("mostra só vendas da loja física com totais e vendedores", async () => {
    render(<POSSales />);

    expect(await screen.findByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("3 vendas registradas")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 450,00").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("R$ 150,00")).toBeInTheDocument();
    // Vendedor resolvido pelo código (ANA01) e pelo CPF (222) na tabela.
    expect(rows()[0]).toHaveTextContent("Ana Vendas");
    expect(rows()[1]).toHaveTextContent("Bruno Loja");
    expect(screen.getByText("Não informado")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 3 de 3 vendas")).toBeInTheDocument();
    expect(screen.getAllByRole("option").map((o) => o.textContent?.trim())).toEqual([
      "Todos os vendedores",
      "Ana Vendas (ANA01)",
      "Bruno Loja",
    ]);
  });

  it("filtra por vendedor (CPF ou código) e pela busca", async () => {
    render(<POSSales />);
    await screen.findByText("Maria");

    await userEvent.selectOptions(screen.getByRole("combobox"), "111");
    expect(rows()).toHaveLength(1);
    expect(screen.getByText("Maria")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole("combobox"), "222");
    expect(screen.getByText("Mostrando 1 de 3 vendas")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole("combobox"), "all");
    await userEvent.type(screen.getByPlaceholderText("Buscar por ID, vendedor ou cliente..."), "cliente app");
    expect(rows()).toHaveLength(1);

    await userEvent.type(screen.getByPlaceholderText("Buscar por ID, vendedor ou cliente..."), "zzz");
    expect(screen.getByText("Nenhuma venda encontrada.")).toBeInTheDocument();
  });

  it("mostra ticket zerado quando a API falha", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.get).mockRejectedValueOnce(new Error("500"));
    render(<POSSales />);

    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    expect(screen.getByText("0 vendas registradas")).toBeInTheDocument();
    expect(screen.getByText("Ticket Médio").nextElementSibling).toHaveTextContent("R$ 0,00");
  });
});
