import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import CouponField from "./CouponField";
import { makeCartItem, renderWithProviders, seedCart } from "@/test/renderWithProviders";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

describe("CouponField", () => {
  beforeEach(() => {
    seedCart([makeCartItem({ preco: 1000 })]);
  });

  it("estado padrão: campo e botão Aplicar", () => {
    renderWithProviders(<CouponField />);

    expect(screen.getByRole("textbox", { name: "Cupom de desconto" })).toHaveAttribute("placeholder", "Digite o código");
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeEnabled();
  });

  it("carregando: bloqueia o botão até a resposta", async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.mocked(api.get).mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    renderWithProviders(<CouponField />);

    await user.type(screen.getByRole("textbox", { name: "Cupom de desconto" }), "dk20");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByRole("button", { name: /Carregando/ })).toBeDisabled();
    resolve({ valid: true, tipoCupom: "porcentagem", valorDesconto: 20 });
    expect(await screen.findByText("DK20 aplicado")).toBeInTheDocument();
  });

  it("erro: mensagem abaixo do campo, ligada por aria-describedby", async () => {
    vi.mocked(api.get).mockResolvedValue({ valid: false, reason: "invalid" });
    const user = userEvent.setup();
    renderWithProviders(<CouponField />);

    const input = screen.getByRole("textbox", { name: "Cupom de desconto" });
    await user.type(input, "XYZ");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Cupom inválido ou expirado.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);
  });

  it("aplicado: mostra a economia e permite remover", async () => {
    vi.mocked(api.get).mockResolvedValue({ valid: true, tipoCupom: "fixo", valorDesconto: 100 });
    const user = userEvent.setup();
    renderWithProviders(<CouponField />);

    await user.type(screen.getByRole("textbox", { name: "Cupom de desconto" }), "BEMVINDA100");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(await screen.findByText("BEMVINDA100 aplicado")).toBeInTheDocument();
    expect(screen.getByText(/Você economizou R\$\s100,00/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remover cupom BEMVINDA100" }));
    expect(screen.getByRole("textbox", { name: "Cupom de desconto" })).toBeInTheDocument();
  });
});
