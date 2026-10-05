import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CarrinhoPage from "./page";
import { makeCartItem, renderWithProviders, seedCart } from "@/test/renderWithProviders";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const rose = makeCartItem({ sku: "ROSE-M", idProduto: 1, titulo: "Vestido Princesa Rosé", preco: 899.9 });
const marinho = makeCartItem({
  sku: "MAR-G",
  idProduto: 2,
  titulo: "Vestido Longo Marinho",
  cor: "Azul-marinho",
  tamanho: "G",
  preco: 749.9,
});

function renderCart() {
  window.scrollTo = vi.fn();
  return renderWithProviders(<CarrinhoPage />, { route: "/carrinho" });
}

describe("CarrinhoPage", () => {
  it("carrinho vazio mostra o EmptyState com CTA para o catálogo", () => {
    renderCart();

    expect(screen.getByRole("heading", { name: "Seu carrinho está vazio" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorar vestidos" })).toHaveAttribute("href", "/produtos");
  });

  describe("com itens", () => {
    beforeEach(() => {
      seedCart([rose, marinho], { cep: "70000000", frete: 24.9, prazoDias: 3 });
    });

    it("mostra contagem, itens e resumo com frete incluído", () => {
      renderCart();

      expect(screen.getByRole("heading", { level: 1, name: "Seu carrinho" })).toBeInTheDocument();
      expect(screen.getByText("2 itens · Confira tamanho e cor")).toBeInTheDocument();
      expect(screen.getAllByTestId("cart-line-item")).toHaveLength(2);

      const summary = screen.getByRole("region", { name: "Resumo do pedido" });
      expect(within(summary).getByText("Subtotal (2 itens)")).toBeInTheDocument();
      expect(within(summary).getByText(/R\$\s1\.674,70/)).toBeInTheDocument();
      expect(within(summary).getByText("Frete incluído no total")).toBeInTheDocument();
      expect(screen.getByText("Entrega para 70000-000")).toBeInTheDocument();
    });

    it("+ aumenta a quantidade e recalcula", async () => {
      const user = userEvent.setup();
      renderCart();

      await user.click(screen.getByRole("button", { name: "Aumentar quantidade de Vestido Princesa Rosé" }));

      expect(screen.getByText("3 itens · Confira tamanho e cor")).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Resumo do pedido" })).toHaveTextContent(/R\$\s2\.574,60/);
    });

    it("Manter no carrinho fecha o diálogo sem remover", async () => {
      const user = userEvent.setup();
      renderCart();

      await user.click(screen.getByRole("button", { name: "Remover Vestido Princesa Rosé" }));
      const dialog = await screen.findByRole("dialog", { name: "Remover este vestido?" });
      await user.click(within(dialog).getByRole("button", { name: "Manter no carrinho" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getAllByTestId("cart-line-item")).toHaveLength(2);
    });

    it("remove item a item até o estado vazio, com o diálogo final no último", async () => {
      const user = userEvent.setup();
      renderCart();

      await user.click(screen.getByRole("button", { name: "Remover Vestido Princesa Rosé" }));
      await user.click(
        within(await screen.findByRole("dialog", { name: "Remover este vestido?" })).getByRole("button", {
          name: "Remover vestido",
        }),
      );
      expect(screen.getByText("1 item · Confira tamanho e cor")).toBeInTheDocument();

      // "−" com quantidade 1 também pede confirmação.
      await user.click(screen.getByRole("button", { name: "Diminuir quantidade de Vestido Longo Marinho" }));
      await user.click(
        within(await screen.findByRole("dialog", { name: "Remover o último vestido?" })).getByRole("button", {
          name: "Remover vestido",
        }),
      );

      expect(await screen.findByRole("heading", { name: "Seu carrinho está vazio" })).toBeInTheDocument();
    });

    it("Finalizar a compra leva ao checkout", async () => {
      const user = userEvent.setup();
      renderCart();

      await user.click(screen.getAllByRole("button", { name: "Finalizar a compra" })[0]);

      expect(screen.getByTestId("location")).toHaveTextContent("/checkout");
    });
  });

  it("sem CEP informado, o frete fica a calcular e o campo de CEP aparece", () => {
    seedCart([rose]);
    renderCart();

    const summary = screen.getByRole("region", { name: "Resumo do pedido" });
    expect(within(summary).getByText("A calcular")).toBeInTheDocument();
    expect(within(summary).getByText("Informe o CEP para incluir o frete")).toBeInTheDocument();
    expect(screen.getAllByLabelText("CEP de entrega").length).toBeGreaterThan(0);
  });
});
