import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SaleCompleted, SaleFailed } from "./SaleResult";

describe("SaleCompleted", () => {
  it("resume a venda registrada e inicia uma nova venda", async () => {
    const onNewSale = vi.fn();
    render(<SaleCompleted saleId="84" customerName="Marina Oliveira" sellerCode="ANA01" total={899.9} onNewSale={onNewSale} />);

    expect(screen.getByRole("heading", { name: "Venda concluída" })).toBeInTheDocument();
    expect(screen.getByText("Venda #84 registrada com sucesso.")).toBeInTheDocument();
    expect(screen.getByText(/Cliente: Marina Oliveira · Vendedor: ANA01 · Total: R\$\s899,90/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Nova venda" }));
    expect(onNewSale).toHaveBeenCalledTimes(1);
  });

  it("não exibe o CPF do vendedor por inteiro nem o cliente ausente", () => {
    render(<SaleCompleted saleId="85" sellerCode="12345678900" total={10} onNewSale={() => {}} />);

    expect(screen.getByText(/Vendedor: \*\*\*\.\*\*\*\.\*\*\*-00/)).toBeInTheDocument();
    expect(screen.queryByText(/Cliente:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/12345678900/)).not.toBeInTheDocument();
  });
});

describe("SaleFailed", () => {
  it("avisa que os itens foram preservados e oferece as duas saídas", async () => {
    const onRetry = vi.fn();
    const onBack = vi.fn();
    render(<SaleFailed onRetry={onRetry} onBack={onBack} />);

    expect(screen.getByRole("heading", { name: "Falha na venda" })).toBeInTheDocument();
    expect(
      screen.getByText("Não foi possível registrar a venda. Os itens foram preservados para tentar novamente."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Motivo:/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await userEvent.click(screen.getByRole("button", { name: "Voltar à venda" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("mostra o motivo da API e bloqueia nova tentativa enquanto reenvia", () => {
    render(<SaleFailed reason="Estoque insuficiente" retrying onRetry={() => {}} onBack={() => {}} />);

    expect(screen.getByText("Motivo: Estoque insuficiente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeDisabled();
  });
});
