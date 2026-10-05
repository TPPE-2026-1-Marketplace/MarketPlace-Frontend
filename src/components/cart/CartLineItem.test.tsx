import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CartLineItem from "./CartLineItem";
import { makeCartItem, renderWithProviders } from "@/test/renderWithProviders";

function renderItem(quantity = 2) {
  const handlers = { onIncrease: vi.fn(), onDecrease: vi.fn(), onRemove: vi.fn() };
  renderWithProviders(<CartLineItem item={makeCartItem({ quantity, preco: 899.9 })} {...handlers} />);
  return handlers;
}

describe("CartLineItem", () => {
  it("mostra nome, cor • tamanho, preço unitário e quantidade", () => {
    renderItem(2);

    expect(screen.getByRole("link", { name: "Vestido Princesa Rosé" })).toHaveAttribute("href", "/produtos/1");
    expect(screen.getByText(/Rosa antigo •/)).toHaveTextContent("Rosa antigo • Tam. M");
    // Preço unitário (o Figma mostra R$ 899,90 mesmo com quantidade 2).
    expect(screen.getByText(/R\$\s899,90/)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Quantidade de Vestido Princesa Rosé" })).toHaveTextContent("2");
  });

  it("dispara as ações de quantidade e remoção", async () => {
    const user = userEvent.setup();
    const handlers = renderItem();

    await user.click(screen.getByRole("button", { name: "Aumentar quantidade de Vestido Princesa Rosé" }));
    await user.click(screen.getByRole("button", { name: "Diminuir quantidade de Vestido Princesa Rosé" }));
    await user.click(screen.getByRole("button", { name: "Remover Vestido Princesa Rosé" }));

    expect(handlers.onIncrease).toHaveBeenCalledOnce();
    expect(handlers.onDecrease).toHaveBeenCalledOnce();
    expect(handlers.onRemove).toHaveBeenCalledOnce();
  });
});
