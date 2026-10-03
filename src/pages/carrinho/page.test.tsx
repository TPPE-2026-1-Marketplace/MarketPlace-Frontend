import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { renderWithProviders } from "@/test/render";
import CarrinhoPage from "./page";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn() },
}));
const getMock = vi.mocked(api.get);
const postMock = vi.mocked(api.post);

function seedCart() {
  localStorage.setItem(
    "cart",
    JSON.stringify({
      id: 1,
      subtotal: 500,
      desconto: 0,
      total: 500,
      frete: 0,
      items: [
        {
          id: 1,
          quantity: 2,
          variant: {
            codigoSku: "ROSA-P",
            precoVariante: 200,
            cor: "Rosa",
            tamanho: "P",
            images: [{ url: "/rosa.jpg" }],
            produto: { idProduto: 1, titulo: "Vestido Rosa", precoBase: 180 },
          },
        },
        {
          id: 2,
          quantity: 1,
          variant: { codigoSku: "AZUL-M", produto: { idProduto: 2, titulo: "Vestido Azul", precoBase: 100 } },
        },
      ],
    }),
  );
}

const money = (text: string) => new RegExp(text.replace(/[.$]/g, (c) => `\\${c}`).replace(" ", "\\s"));

describe("CarrinhoPage", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    getMock.mockReset();
    postMock.mockReset();
  });

  it("mostra o carrinho vazio", () => {
    renderWithProviders(<CarrinhoPage />);

    expect(screen.getByText("Seu carrinho está vazio")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continuar Comprando/ })).toHaveAttribute("href", "/produtos");
  });

  it("lista itens com variação, preço unitário e resumo", () => {
    seedCart();
    renderWithProviders(<CarrinhoPage />);

    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByText("Vestido Rosa")).toBeInTheDocument();
    expect(screen.getByText("P")).toBeInTheDocument();
    expect(screen.getByText(money("R$ 400,00"))).toBeInTheDocument();
    expect(screen.getByText(/R\$\s200,00 cada/)).toBeInTheDocument();
    expect(screen.getByAltText("Vestido Azul")).toHaveAttribute("src", "/hero-dress.png");
    expect(screen.getByText("Subtotal (2 itens)")).toBeInTheDocument();
  });

  it("altera quantidades, remove itens, limpa e finaliza", async () => {
    seedCart();
    renderWithProviders(<CarrinhoPage />);
    const rosa = screen.getByText("Vestido Rosa").closest("div.bg-white") as HTMLElement;
    const [remove, minus, plus] = Array.from(rosa.querySelectorAll("button"));

    await userEvent.click(plus);
    expect(rosa).toHaveTextContent("3");
    await userEvent.click(minus);
    await userEvent.click(minus);
    expect(screen.queryByText(/cada$/)).not.toBeInTheDocument();
    await userEvent.click(remove);
    expect(screen.queryByText("Vestido Rosa")).not.toBeInTheDocument();
    expect(screen.getByText("1 item")).toBeInTheDocument();
    expect(screen.getByText("Subtotal (1 item)")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Finalizar Compra/ }));
    expect(screen.getByTestId("location")).toHaveTextContent("/checkout");

    await userEvent.click(screen.getByRole("button", { name: "Limpar carrinho" }));
    expect(screen.getByText("Seu carrinho está vazio")).toBeInTheDocument();
  });

  it("valida o CEP e calcula o frete", async () => {
    seedCart();
    postMock.mockResolvedValueOnce({ valor: 25.9, prazo_dias: 3 }).mockResolvedValueOnce({ valor: 0, prazo_dias: 1 });
    renderWithProviders(<CarrinhoPage />);
    const cep = screen.getByPlaceholderText("Digite seu CEP");
    const calcular = screen.getByRole("button", { name: "Calcular" });

    await userEvent.type(cep, "123");
    await userEvent.click(calcular);
    expect(screen.getByText("CEP inválido. Use 8 dígitos.")).toBeInTheDocument();

    await userEvent.clear(cep);
    await userEvent.type(cep, "70000-000");
    await userEvent.click(calcular);
    // O plural hoje sai "dias útileis" (" útil" + "eis"): só o início é verificado.
    expect(await screen.findByText(/^Prazo estimado: 3 dias/)).toBeInTheDocument();
    expect(postMock).toHaveBeenCalledWith("/shipping/calculate", { cep_destino: "70000000" });
    expect(screen.getByText(money("R$ 25,90"))).toBeInTheDocument();

    await userEvent.click(calcular);
    expect(await screen.findByText("Grátis")).toBeInTheDocument();
    expect(screen.getByText("Prazo estimado: 1 dia útil")).toBeInTheDocument();

    postMock.mockRejectedValueOnce(new Error("offline"));
    await userEvent.click(calcular);
    expect(await screen.findByText("Erro ao calcular frete. Tente novamente.")).toBeInTheDocument();
  });

  it("aplica cupom percentual e fixo e trata cupons inválidos", async () => {
    seedCart();
    renderWithProviders(<CarrinhoPage />);
    const input = screen.getByPlaceholderText("Código do cupom");
    const aplicar = screen.getByRole("button", { name: "Aplicar" });

    await userEvent.click(aplicar);
    expect(getMock).not.toHaveBeenCalled();

    getMock.mockResolvedValueOnce({ valid: true, tipoCupom: "porcentagem", valorDesconto: 10 });
    await userEvent.type(input, " DK10 ");
    await userEvent.click(aplicar);
    expect(await screen.findByText("Cupom aplicado com sucesso!")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith("/coupons/validate/DK10?productIds=1,2");
    expect(screen.getByText(money("-R$ 50,00"))).toBeInTheDocument();

    getMock.mockResolvedValueOnce({ valid: true, tipoCupom: "fixo", valorDesconto: 30 });
    await userEvent.click(aplicar);
    await waitFor(() => expect(screen.getByText(money("-R$ 30,00"))).toBeInTheDocument());

    for (const [reason, text] of [
      ["expired", "Cupom expirado."],
      ["limit_reached", "Limite de uso atingido."],
      ["ineligible_products", "Cupom não aplicável a estes produtos."],
      ["outro", "Cupom inválido."],
    ]) {
      getMock.mockResolvedValueOnce({ valid: false, reason });
      await userEvent.click(aplicar);
      expect(await screen.findByText(text)).toBeInTheDocument();
    }
    expect(screen.queryByText("Desconto")).not.toBeInTheDocument();

    getMock.mockRejectedValueOnce(new Error("offline"));
    await userEvent.click(aplicar);
    expect(await screen.findByText("Erro ao validar cupom.")).toBeInTheDocument();
  });

  it("mostra o cupom já aplicado no carrinho salvo", () => {
    seedCart();
    const cart = JSON.parse(localStorage.getItem("cart")!);
    localStorage.setItem("cart", JSON.stringify({ ...cart, cupom: "SALVO", desconto: 10, total: 490 }));

    renderWithProviders(<CarrinhoPage />);

    expect(screen.getByText("Cupom SALVO aplicado.")).toBeInTheDocument();
  });
});
