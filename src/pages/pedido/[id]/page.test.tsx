import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { renderWithProviders } from "@/test/render";
import PedidoStatusPage from "./page";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn() },
}));
const getMock = vi.mocked(api.get);

function renderPage(route = "/pedido/42") {
  return renderWithProviders(<PedidoStatusPage />, {
    route,
    path: route.startsWith("/pedido/") ? "/pedido/:idPedido" : "/pedido",
  });
}

describe("PedidoStatusPage", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("avisa quando não há pedido na rota nem pendente", async () => {
    renderPage("/pedido");

    expect(await screen.findByText("Não foi possível identificar o pedido.")).toBeInTheDocument();
    expect(getMock).not.toHaveBeenCalled();
  });

  it("confirma o pagamento e limpa o pedido pendente", async () => {
    localStorage.setItem("dk_pending_order", "42");
    getMock.mockResolvedValueOnce({ status: "paid", paidAmount: 150.5 });
    renderPage();

    expect(screen.getByText("Consultando pagamento…")).toBeInTheDocument();
    expect(await screen.findByText("Pagamento confirmado!")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith("/payments/order/42");
    expect(screen.getByText(/R\$\s150,50/)).toBeInTheDocument();
    expect(localStorage.getItem("dk_pending_order")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Ver meus pedidos" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/conta");
  });

  it("usa o pedido pendente salvo quando a rota não traz id", async () => {
    localStorage.setItem("dk_pending_order", "77");
    getMock.mockResolvedValueOnce({ status: "failed" });
    renderPage("/pedido");

    expect(await screen.findByText("Pagamento não concluído")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith("/payments/order/77");
  });

  it("consulta de novo enquanto o pagamento está pendente", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getMock.mockResolvedValueOnce({ status: "pending" }).mockResolvedValueOnce({ status: "paid", paidAmount: null });
    renderPage();

    expect(await screen.findByText("Aguardando confirmação")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(await screen.findByText("Pagamento confirmado!")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("mostra o erro da consulta e permite voltar à loja", async () => {
    getMock.mockRejectedValueOnce(new Error("Pedido não encontrado"));
    renderPage();

    expect(await screen.findByText("Pedido não encontrado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Voltar à loja" }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  it("usa mensagem padrão para erros desconhecidos", async () => {
    getMock.mockRejectedValueOnce("falha");
    renderPage();

    expect(await screen.findByText("Não foi possível consultar o pagamento.")).toBeInTheDocument();
  });
});
