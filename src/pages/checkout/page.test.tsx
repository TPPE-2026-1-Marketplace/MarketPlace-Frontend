import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import CheckoutPage from "./page";
import { makeCartItem, renderWithProviders, seedCart } from "@/test/renderWithProviders";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

function renderCheckout() {
  window.scrollTo = vi.fn();
  return renderWithProviders(<CheckoutPage />, { route: "/checkout" });
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);
    vi.mocked(api.post).mockResolvedValue({ valor: 24.9, prazo_dias: 3 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ erro: true }) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sem itens volta para o carrinho", () => {
    renderCheckout();
    expect(screen.getByTestId("location")).toHaveTextContent("/carrinho");
  });

  describe("com itens", () => {
    beforeEach(() => {
      seedCart([makeCartItem({ preco: 899.9 }), makeCartItem({ sku: "B", idProduto: 2, preco: 749.9 })]);
    });

    it("mostra a página única com stepper, seções e resumo", () => {
      renderCheckout();

      expect(screen.getByRole("heading", { level: 1, name: "Finalizar compra" })).toBeInTheDocument();
      const stepper = screen.getByRole("navigation", { name: "Etapas da compra" });
      expect(within(stepper).getByRole("button", { current: "step" })).toHaveTextContent("1");
      for (const name of ["Dados de contato", "Entrega", "Pagamento", "Resumo do pedido"]) {
        expect(screen.getByRole("heading", { name })).toBeInTheDocument();
      }
      expect(screen.getByRole("button", { name: "Finalizar pedido" })).toBeInTheDocument();
    });

    it("valida ao finalizar: erro abaixo do campo e foco no primeiro inválido", async () => {
      const user = userEvent.setup();
      renderCheckout();

      await user.click(screen.getByRole("button", { name: "Finalizar pedido" }));

      const nome = screen.getByLabelText("Nome completo");
      expect(nome).toHaveFocus();
      expect(nome).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("Informe seu nome completo.")).toBeInTheDocument();
      expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalledWith("/orders/guest", expect.anything());

      await user.type(nome, "Mariana");
      expect(screen.queryByText("Informe seu nome completo.")).not.toBeInTheDocument();
    });

    it("aplica máscara no CPF e calcula o frete pelo CEP", async () => {
      const user = userEvent.setup();
      renderCheckout();

      await user.type(screen.getByLabelText("CPF"), "11144477735");
      expect(screen.getByLabelText("CPF")).toHaveValue("111.444.777-35");

      await user.type(screen.getByLabelText("CEP"), "70000000");
      expect(screen.getByLabelText("CEP")).toHaveValue("70000-000");

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith("/shipping/calculate", { cep_destino: "70000000" }),
      );
      expect(await screen.findByText(/3 dias úteis • R\$\s24,90/)).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Resumo do pedido" })).toHaveTextContent(/R\$\s1\.674,70/);
    });

    it("Retirar na loja esconde o endereço e zera o frete", async () => {
      const user = userEvent.setup();
      renderCheckout();

      await user.click(screen.getByRole("radio", { name: /Retirar na loja/ }));

      expect(screen.queryByLabelText("CEP")).not.toBeInTheDocument();
      expect(screen.getByText("Retire na loja a partir de amanhã, sem custo de frete.")).toBeInTheDocument();
      const summary = screen.getByRole("region", { name: "Resumo do pedido" });
      expect(within(summary).getByText("Grátis")).toBeInTheDocument();
      expect(summary).toHaveTextContent(/R\$\s1\.649,80/);
    });
  });
});
