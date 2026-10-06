import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { SellerRanking } from "./SellerRanking";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));
const getMock = vi.mocked(api.get);

const ranking = [
  { nome: "Beatriz Estilo", codigo_funcionario: "V-005", total_vendas: 19720, posicao: 1 },
  { nome: "Ana Vendas", codigo_funcionario: "V-003", total_vendas: 18110.5, posicao: 2 },
  { nome: "Carlos Moda", codigo_funcionario: "V-004", total_vendas: 0, posicao: 3 },
];

describe("SellerRanking", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("busca o ranking real em GET /employees/ranking com o mês atual", async () => {
    getMock.mockResolvedValue(ranking);
    render(<SellerRanking />);

    await screen.findByText("Beatriz Estilo");
    const now = new Date();
    expect(getMock).toHaveBeenCalledWith("/employees/ranking", {
      mes: now.getMonth() + 1,
      ano: now.getFullYear(),
    });
  });

  it("mostra os vendedores na ordem da API e destaca a líder", async () => {
    getMock.mockResolvedValue(ranking);
    render(<SellerRanking />);

    await screen.findByText("Beatriz Estilo");
    const names = screen.getAllByText(/^(Ana Vendas|Beatriz Estilo|Carlos Moda)$/).map((el) => el.textContent);
    expect(names).toEqual(["Beatriz Estilo", "Ana Vendas", "Carlos Moda"]);
    expect(screen.getByText("Líder")).toBeInTheDocument();
    expect(screen.getByText("R$ 19.720,00")).toBeInTheDocument();
    // Total da equipe: 19720 + 18110,5 + 0
    expect(screen.getByText("R$ 37.830,50")).toBeInTheDocument();
  });

  it("não destaca líder quando ninguém vendeu no mês", async () => {
    getMock.mockResolvedValue(ranking.map((seller) => ({ ...seller, total_vendas: 0 })));
    render(<SellerRanking />);

    await screen.findByText("Beatriz Estilo");
    expect(screen.queryByText("Líder")).not.toBeInTheDocument();
  });

  it("modo compacto mostra só o top 3 com os valores", async () => {
    getMock.mockResolvedValue([
      ...ranking,
      { nome: "Diego Outlet", codigo_funcionario: "V-006", total_vendas: 0, posicao: 4 },
    ]);
    render(<SellerRanking compact />);

    await screen.findByText("Beatriz Estilo");
    expect(screen.getByText("1°")).toBeInTheDocument();
    expect(screen.getByText("3°")).toBeInTheDocument();
    expect(screen.getByText("R$ 19.720")).toBeInTheDocument();
    expect(screen.queryByText("Diego Outlet")).not.toBeInTheDocument();
    expect(screen.queryByText("Ranking de Vendedores")).not.toBeInTheDocument();
  });

  it("mostra a mensagem de erro quando a API falha", async () => {
    getMock.mockRejectedValue(new Error("Request failed with status 403"));
    render(<SellerRanking />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Request failed with status 403");
  });

  it("mostra estado vazio quando não há vendedores", async () => {
    getMock.mockResolvedValue([]);
    render(<SellerRanking />);

    expect(await screen.findByText("Nenhum vendedor no ranking deste mês.")).toBeInTheDocument();
  });
});
