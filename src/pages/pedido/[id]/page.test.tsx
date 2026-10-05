import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PENDING_ORDER_KEY, saveOrderSnapshot } from "@/hooks/useOrderSnapshot";
import type { OrderSnapshot } from "@/types/checkout";
import PedidoConfirmacaoPage from "./page";
import { renderWithProviders } from "@/test/renderWithProviders";

const snapshot: OrderSnapshot = {
  idPedido: 1042,
  nome: "Mariana Lima",
  email: "mariana@email.com",
  itemCount: 2,
  subtotal: 1498.9,
  frete: 24.9,
  desconto: 100,
  total: 1423.8,
  tipoRetirada: "entrega",
  metodoPagamento: "credit_card",
  parcelas: 6,
  criadoEm: "2026-10-04T12:00:00.000Z",
};

function renderPedido(route: string) {
  return renderWithProviders(<PedidoConfirmacaoPage />, {
    route,
    path: route.startsWith("/pedido/") ? "/pedido/:idPedido" : "/pedido",
  });
}

describe("PedidoConfirmacaoPage (Finalizado)", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("mostra a confirmação com o resumo salvo antes do pagamento", () => {
    saveOrderSnapshot(snapshot);
    renderPedido("/pedido/1042");

    expect(screen.getByText("PEDIDO RECEBIDO")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Obrigada pela sua compra!" })).toBeInTheDocument();
    expect(screen.getByText(/Mariana, seu pedido #1042 foi registrado\./)).toBeInTheDocument();

    const summary = screen.getByRole("region", { name: "Resumo do pedido" });
    expect(within(summary).getByText("Subtotal (2 itens)")).toBeInTheDocument();
    expect(summary).toHaveTextContent(/− R\$\s100,00/);
    expect(summary).toHaveTextContent(/R\$\s1\.423,80/);
    expect(summary).toHaveTextContent(/6x de R\$\s237,30 sem juros no cartão/);

    expect(screen.getByText("E agora?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continuar comprando" })).toHaveAttribute("href", "/");
  });

  it("sem resumo salvo (outro pedido/dispositivo) mostra só a confirmação", () => {
    saveOrderSnapshot(snapshot);
    renderPedido("/pedido/77");

    expect(screen.getByText(/^Seu pedido #77 foi registrado\./)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Resumo do pedido" })).not.toBeInTheDocument();
  });

  it("/pedido sem id usa o último pedido enviado ao pagamento", () => {
    saveOrderSnapshot({ ...snapshot, metodoPagamento: "pix", parcelas: 1 });
    expect(localStorage.getItem(PENDING_ORDER_KEY)).toBe("1042");
    renderPedido("/pedido");

    expect(screen.getByText(/Mariana, seu pedido #1042 foi registrado\./)).toBeInTheDocument();
    expect(screen.getByText("Pagamento via PIX")).toBeInTheDocument();
  });
});
