import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ExportClientsDialog from "./ExportClientsDialog";

function setup(count = 1248) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(<ExportClientsDialog count={count} filename="clientes_2026-11-07.csv" onConfirm={onConfirm} onClose={onClose} />);
  return { onConfirm, onClose };
}

describe("ExportClientsDialog", () => {
  it("pede a revisão dos dados antes de exportar", () => {
    setup();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Exportar clientes")).toBeInTheDocument();
    expect(screen.getByText("Resultado atual da busca")).toBeInTheDocument();
    expect(screen.getByText("1.248 clientes")).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
    expect(screen.getByText("Nome, e-mail, telefone e CPF")).toBeInTheDocument();
  });

  it("confirma a exportação e mostra o arquivo preparado", async () => {
    const { onConfirm, onClose } = setup(1);

    await userEvent.click(screen.getByRole("button", { name: "Confirmar exportação" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Exportação preparada")).toBeInTheDocument();
    expect(screen.getByText("clientes_2026-11-07.csv")).toBeInTheDocument();
    expect(screen.getByText("1 cliente")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cancela sem exportar", async () => {
    const { onConfirm, onClose } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
