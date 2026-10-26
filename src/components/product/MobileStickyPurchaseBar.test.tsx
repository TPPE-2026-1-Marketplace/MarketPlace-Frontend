import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MobileStickyPurchaseBar } from "./MobileStickyPurchaseBar";

describe("MobileStickyPurchaseBar", () => {
  it("exibe o valor da parcela com divisao exata sem truncamento indevido", () => {
    render(
      <MobileStickyPurchaseBar
        price={1000}
        added={false}
        onAddToCart={vi.fn()}
      />,
    );

    expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument();
    // 1000 / 6 = 166.666... formatado como moeda deve ser 166,67 e não truncado para 166,00
    expect(screen.getByText("6x de R$ 166,67 sem juros")).toBeInTheDocument();
  });

  it("desabilita o botao de adicionar quando esgotado", () => {
    render(
      <MobileStickyPurchaseBar
        price={250}
        added={false}
        onAddToCart={vi.fn()}
        isOutOfStock={true}
      />,
    );

    const button = screen.getByRole("button", { name: "Esgotado" });
    expect(button).toBeDisabled();
  });

  it("chama onAddToCart ao clicar no botao habilitado", async () => {
    const handleAddToCart = vi.fn();
    render(
      <MobileStickyPurchaseBar
        price={250}
        added={false}
        onAddToCart={handleAddToCart}
        isOutOfStock={false}
      />,
    );

    const button = screen.getByRole("button", { name: "Adicionar" });
    await userEvent.click(button);
    expect(handleAddToCart).toHaveBeenCalledTimes(1);
  });
});
