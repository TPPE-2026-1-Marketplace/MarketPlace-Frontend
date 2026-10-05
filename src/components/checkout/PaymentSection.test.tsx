import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { PaymentMethod } from "@/types/checkout";
import PaymentSection from "./PaymentSection";

function PaymentHarness() {
  const [method, setMethod] = useState<PaymentMethod>("credit_card");
  const [installments, setInstallments] = useState(1);
  return (
    <PaymentSection
      method={method}
      onMethodChange={setMethod}
      installments={installments}
      onInstallmentsChange={setInstallments}
      total={1423.8}
    />
  );
}

describe("PaymentSection", () => {
  it("começa no cartão com parcelas de 1x a 6x", () => {
    render(<PaymentHarness />);

    expect(screen.getByRole("radio", { name: /Cartão de crédito/ })).toBeChecked();
    const parcelas = screen.getByRole("combobox", { name: "Parcelas" });
    expect(within(parcelas).getAllByRole("option")).toHaveLength(6);
    expect(within(parcelas).getAllByRole("option")[5]).toHaveTextContent(/6x de R\$\s237,30 sem juros/);
    // O cartão é digitado no ambiente seguro: nada de número/CVV aqui.
    expect(screen.queryByLabelText(/CVV|Número do cartão/)).not.toBeInTheDocument();
  });

  it("Boleto aparece desabilitado", () => {
    render(<PaymentHarness />);

    expect(screen.getByRole("radio", { name: /Boleto/ })).toBeDisabled();
    expect(screen.getByText("Em breve")).toBeInTheDocument();
  });

  it("PIX esconde as parcelas e mostra o aviso do QR", async () => {
    const user = userEvent.setup();
    render(<PaymentHarness />);

    await user.click(screen.getByRole("radio", { name: /PIX/ }));

    expect(screen.getByRole("radio", { name: /PIX/ })).toBeChecked();
    expect(screen.queryByRole("combobox", { name: "Parcelas" })).not.toBeInTheDocument();
    expect(screen.getByText(/Será gerado um QR/)).toBeInTheDocument();
  });

  it("troca a quantidade de parcelas", async () => {
    const user = userEvent.setup();
    render(<PaymentHarness />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Parcelas" }), "3");
    expect(screen.getByRole("combobox", { name: "Parcelas" })).toHaveValue("3");
  });
});
