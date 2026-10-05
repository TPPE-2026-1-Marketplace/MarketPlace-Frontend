import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { CheckoutForm } from "@/types/checkout";
import { CartProvider, useCart } from "./useCart";
import {
  buildInstallmentOptions,
  buildOrderPayload,
  getCurrentStep,
  getFirstInvalidField,
  useCheckout,
  validateCheckoutForm,
} from "./useCheckout";
import { readOrderSnapshot } from "./useOrderSnapshot";
import { makeCartItem, ROUTER_FUTURE, seedCart } from "@/test/renderWithProviders";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigateMock,
}));

const validForm: CheckoutForm = {
  nome: "Mariana Lima",
  email: "mariana@email.com",
  cpf: "111.444.777-35",
  telefone: "(61) 99999-0000",
  cep: "70000-000",
  rua: "SQN 210, Bloco A",
  numero: "123",
  complemento: "",
  bairro: "Asa Norte",
  cidade: "Brasília",
  estado: "DF",
};

describe("validateCheckoutForm", () => {
  it("aceita um formulário completo", () => {
    expect(validateCheckoutForm(validForm, "entrega", { hasShippingQuote: true })).toEqual({});
  });

  it("exige os dados de contato (só o complemento é opcional)", () => {
    const errors = validateCheckoutForm(
      { ...validForm, nome: " ", email: "", cpf: "", telefone: "" },
      "entrega",
      { hasShippingQuote: true },
    );
    expect(Object.keys(errors)).toEqual(["nome", "email", "cpf", "telefone"]);
  });

  it("valida formato de e-mail, CPF e telefone", () => {
    const errors = validateCheckoutForm(
      { ...validForm, email: "mariana@", cpf: "123.456", telefone: "(61) 9999" },
      "entrega",
      { hasShippingQuote: true },
    );
    expect(errors).toEqual({
      email: "E-mail inválido.",
      cpf: "O CPF deve ter 11 dígitos.",
      telefone: "Informe um telefone com DDD.",
    });
  });

  it("exige endereço e frete calculado na entrega padrão", () => {
    const empty = { ...validForm, cep: "7000", rua: "", numero: "", bairro: "", cidade: "", estado: "D" };
    expect(Object.keys(validateCheckoutForm(empty, "entrega", { hasShippingQuote: false }))).toEqual([
      "cep",
      "rua",
      "numero",
      "bairro",
      "cidade",
      "estado",
    ]);
    expect(validateCheckoutForm(validForm, "entrega", { hasShippingQuote: false }).cep).toBe(
      "Não foi possível calcular o frete para este CEP.",
    );
  });

  it("dispensa o endereço ao retirar na loja", () => {
    const semEndereco = { ...validForm, cep: "", rua: "", numero: "", bairro: "", cidade: "", estado: "" };
    expect(validateCheckoutForm(semEndereco, "loja", { hasShippingQuote: false })).toEqual({});
  });
});

describe("getFirstInvalidField", () => {
  it("segue a ordem visual dos campos", () => {
    expect(getFirstInvalidField({ estado: "x", email: "x", rua: "x" })).toBe("email");
    expect(getFirstInvalidField({})).toBeNull();
  });
});

describe("getCurrentStep", () => {
  it("avança conforme as seções ficam completas", () => {
    expect(getCurrentStep({ ...validForm, email: "" }, "entrega", true)).toBe("dados");
    expect(getCurrentStep(validForm, "entrega", false)).toBe("entrega");
    expect(getCurrentStep(validForm, "entrega", true)).toBe("pagamento");
    expect(getCurrentStep({ ...validForm, cep: "" }, "loja", false)).toBe("pagamento");
  });
});

describe("buildInstallmentOptions", () => {
  it("gera 1x a 6x sem juros (exemplo do Figma)", () => {
    const options = buildInstallmentOptions(1423.8);
    expect(options).toHaveLength(6);
    expect(options[0].label).toMatch(/^1x de R\$\s1\.423,80 sem juros$/);
    expect(options[5]).toMatchObject({ value: 6 });
    expect(options[5].label).toMatch(/^6x de R\$\s237,30 sem juros$/);
  });
});

describe("buildOrderPayload", () => {
  const cart = { items: [makeCartItem({ sku: "A", quantity: 2 })], cupom: "BEMVINDA100" };

  it("monta pedido de entrega para convidado", () => {
    expect(buildOrderPayload({ form: validForm, cart, delivery: "entrega", frete: 24.9, isGuest: true })).toEqual({
      items: [{ variantSku: "A", quantidade: 2 }],
      couponNumero: "BEMVINDA100",
      valorFrete: 24.9,
      tipoRetirada: "entrega",
      enderecoCep: "70000000",
      enderecoRua: "SQN 210, Bloco A",
      enderecoNumero: "123",
      enderecoComplemento: null,
      enderecoBairro: "Asa Norte",
      enderecoCidade: "Brasília",
      enderecoEstado: "DF",
      clienteCpfAvulso: "11144477735",
      clienteEmailAvulso: "mariana@email.com",
      clienteNomeAvulso: "Mariana Lima",
      clienteTelefone: "(61) 99999-0000",
    });
  });

  it("retirada na loja zera o frete e não envia endereço; logado não envia dados avulsos", () => {
    const payload = buildOrderPayload({ form: validForm, cart, delivery: "loja", frete: 24.9, isGuest: false });
    expect(payload).toEqual({
      items: [{ variantSku: "A", quantidade: 2 }],
      couponNumero: "BEMVINDA100",
      valorFrete: 0,
      tipoRetirada: "loja",
    });
  });
});

describe("useCheckout — envio", () => {
  const assignMock = vi.fn();
  const originalLocation = window.location;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter future={ROUTER_FUTURE}>
      <CartProvider>{children}</CartProvider>
    </MemoryRouter>
  );

  function renderCheckout() {
    return renderHook(() => ({ checkout: useCheckout(), cart: useCart().cart }), { wrapper });
  }

  function mockApi({ paymentStatus = "pending", failPayment = false } = {}) {
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === "/shipping/calculate") return { valor: 24.9, prazo_dias: 3 };
      if (path.startsWith("/orders")) return { idPedido: 1042 };
      if (path.startsWith("/payments")) {
        if (failPayment) throw new Error("Gateway indisponível");
        return { status: paymentStatus, redirectUrl: "https://pay.example/1042" };
      }
      throw new Error(`rota inesperada ${path}`);
    });
  }

  async function fillValidForm(result: ReturnType<typeof renderCheckout>["result"]) {
    act(() => {
      (Object.keys(validForm) as (keyof CheckoutForm)[]).forEach((field) =>
        result.current.checkout.setField(field, validForm[field]),
      );
    });
    await waitFor(() => expect(result.current.checkout.shipping.quote).not.toBeNull());
  }

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ erro: true }) }));
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    });
    seedCart([makeCartItem({ sku: "A", preco: 899.9 }), makeCartItem({ sku: "B", idProduto: 2, preco: 749.9 })]);
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
    vi.unstubAllGlobals();
    assignMock.mockReset();
    navigateMock.mockReset();
  });

  it("não envia com erros e devolve os campos inválidos", async () => {
    mockApi();
    const { result } = renderCheckout();

    let errors = {};
    await act(async () => {
      errors = await result.current.checkout.submit();
    });

    expect(getFirstInvalidField(errors)).toBe("nome");
    expect(result.current.checkout.errors.email).toBe("Informe seu e-mail.");
    expect(api.post).not.toHaveBeenCalledWith("/orders/guest", expect.anything());
  });

  it("convidado: cria pedido e pagamento, salva o resumo, limpa o carrinho e redireciona", async () => {
    mockApi();
    const { result } = renderCheckout();
    await fillValidForm(result);
    act(() => result.current.checkout.setInstallments(3));

    await act(() => result.current.checkout.submit());

    expect(api.post).toHaveBeenCalledWith("/orders/guest", expect.objectContaining({ valorFrete: 24.9, tipoRetirada: "entrega" }));
    expect(api.post).toHaveBeenCalledWith("/payments/guest", { idPedido: 1042, captureMethod: "credit_card", installments: 3 });
    expect(assignMock).toHaveBeenCalledWith("https://pay.example/1042");
    expect(result.current.cart.items).toHaveLength(0);
    expect(result.current.checkout.completed).toBe(true);
    expect(readOrderSnapshot(1042)).toMatchObject({
      nome: "Mariana Lima",
      itemCount: 2,
      subtotal: 1649.8,
      frete: 24.9,
      total: 1674.7,
      metodoPagamento: "credit_card",
      parcelas: 3,
    });
    expect(localStorage.getItem("dk_pending_order")).toBe("1042");
  });

  it("logado com PIX na loja: usa as rotas autenticadas e parcela única", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "11144477735", name: "Mariana Lima", email: "mariana@email.com", role: "customer" },
    } as ReturnType<typeof useAuth>);
    mockApi();
    const { result } = renderCheckout();
    expect(result.current.checkout.form).toMatchObject({ nome: "Mariana Lima", cpf: "111.444.777-35" });

    act(() => {
      result.current.checkout.setField("telefone", "(61) 99999-0000");
      result.current.checkout.setDelivery("loja");
      result.current.checkout.setPaymentMethod("pix");
    });
    await act(() => result.current.checkout.submit());

    expect(api.post).toHaveBeenCalledWith("/orders", expect.objectContaining({ tipoRetirada: "loja", valorFrete: 0 }));
    expect(api.post).toHaveBeenCalledWith("/payments", { idPedido: 1042, captureMethod: "pix", installments: 1 });
  });

  it("pagamento já aprovado vai direto para a confirmação", async () => {
    mockApi({ paymentStatus: "paid" });
    const { result } = renderCheckout();
    await fillValidForm(result);

    await act(() => result.current.checkout.submit());

    expect(assignMock).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/pedido/1042");
  });

  it("falha no pagamento mantém os dados e não duplica o pedido na nova tentativa", async () => {
    mockApi({ failPayment: true });
    const { result } = renderCheckout();
    await fillValidForm(result);

    await act(() => result.current.checkout.submit());
    expect(result.current.checkout.submitError).toBe("Gateway indisponível");
    expect(result.current.checkout.form.nome).toBe("Mariana Lima");
    expect(result.current.cart.items).toHaveLength(2);

    mockApi();
    await act(() => result.current.checkout.submit());

    const orderCalls = vi.mocked(api.post).mock.calls.filter(([path]) => path.startsWith("/orders"));
    expect(orderCalls).toHaveLength(1);
    expect(assignMock).toHaveBeenCalledWith("https://pay.example/1042");
  });
});
