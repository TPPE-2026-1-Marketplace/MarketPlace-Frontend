import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SellerRanking } from "./SellerRanking";

describe("SellerRanking", () => {
  it("ordena os vendedores pelo total vendido e destaca a líder", () => {
    render(<SellerRanking />);

    const names = screen.getAllByText(/^(Ana Vendas|Beatriz Estilo|Carlos Moda)$/).map((el) => el.textContent);
    expect(names).toEqual(["Beatriz Estilo", "Ana Vendas", "Carlos Moda"]);
    expect(screen.getByText("Líder")).toBeInTheDocument();
    expect(screen.getAllByText("8 vendas")).toHaveLength(2);
    expect(screen.getAllByText("100% (Meta atingida!)")).toHaveLength(3);
    // Total da equipe aparece na meta coletiva e no card "Total de Vendas".
    expect(screen.getAllByText("R$ 54.330")).toHaveLength(2);
    expect(screen.getAllByText("100%").length).toBeGreaterThan(0);
  });

  it("modo compacto mostra só o top 3 com os valores", () => {
    render(<SellerRanking compact />);

    expect(screen.getByText("1°")).toBeInTheDocument();
    expect(screen.getByText("3°")).toBeInTheDocument();
    expect(screen.getByText("R$ 19.720")).toBeInTheDocument();
    expect(screen.queryByText("Ranking de Vendedores")).not.toBeInTheDocument();
  });
});
