import React from "react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { CartProvider, useCart } from "./useCart";
import { COUPON_REQUEST_ERROR, getCouponErrorMessage, INVALID_COUPON_MESSAGE, useCoupon } from "./useCoupon";
import { makeCartItem, seedCart } from "@/test/renderWithProviders";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;

function renderCoupon() {
  return renderHook(() => ({ coupon: useCoupon(), cart: useCart().cart }), { wrapper });
}

describe("getCouponErrorMessage", () => {
  it.each([
    ["expired", "Cupom expirado."],
    ["limit_reached", "Limite de uso atingido."],
    ["ineligible_products", "Cupom não aplicável a estes produtos."],
    ["invalid", INVALID_COUPON_MESSAGE],
    [undefined, INVALID_COUPON_MESSAGE],
  ])("traduz o motivo %s", (reason, message) => {
    expect(getCouponErrorMessage(reason)).toBe(message);
  });
});

describe("useCoupon", () => {
  beforeEach(() => {
    seedCart([
      makeCartItem({ sku: "A", idProduto: 1, preco: 1000 }),
      makeCartItem({ sku: "B", idProduto: 2, preco: 500 }),
      makeCartItem({ sku: "C", idProduto: 1, preco: 500 }),
    ]);
  });

  it("valida o código em maiúsculas com os ids únicos dos produtos", async () => {
    vi.mocked(api.get).mockResolvedValue({ valid: true, tipoCupom: "fixo", valorDesconto: 100 });
    const { result } = renderCoupon();

    await act(() => result.current.coupon.apply(" bemvinda100 "));

    expect(api.get).toHaveBeenCalledWith("/coupons/validate/BEMVINDA100", { productIds: "1,2" });
    expect(result.current.coupon.appliedCode).toBe("BEMVINDA100");
    expect(result.current.cart.desconto).toBe(100);
  });

  it("aplica desconto percentual", async () => {
    vi.mocked(api.get).mockResolvedValue({ valid: true, tipoCupom: "porcentagem", valorDesconto: 20 });
    const { result } = renderCoupon();

    await act(() => result.current.coupon.apply("DK20"));

    expect(result.current.cart.desconto).toBe(400);
    expect(result.current.coupon.error).toBeNull();
  });

  it("mostra o motivo quando o cupom é inválido e não aplica desconto", async () => {
    vi.mocked(api.get).mockResolvedValue({ valid: false, reason: "expired" });
    const { result } = renderCoupon();

    let applied = true;
    await act(async () => {
      applied = await result.current.coupon.apply("VELHO");
    });

    expect(applied).toBe(false);
    expect(result.current.coupon.error).toBe("Cupom expirado.");
    expect(result.current.cart.cupom ?? null).toBeNull();
  });

  it("trata erro de rede", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("offline"));
    const { result } = renderCoupon();

    await act(() => result.current.coupon.apply("DK20"));

    expect(result.current.coupon.error).toBe(COUPON_REQUEST_ERROR);
    expect(result.current.coupon.loading).toBe(false);
  });

  it("pede o código quando o campo está vazio, sem chamar a API", async () => {
    const { result } = renderCoupon();

    await act(() => result.current.coupon.apply("   "));

    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.coupon.error).toBe("Digite o código do cupom.");
  });

  it("remove o cupom aplicado", async () => {
    vi.mocked(api.get).mockResolvedValue({ valid: true, tipoCupom: "fixo", valorDesconto: 100 });
    const { result } = renderCoupon();
    await act(() => result.current.coupon.apply("DK100"));

    act(() => result.current.coupon.remove());

    expect(result.current.coupon.appliedCode).toBeNull();
    expect(result.current.cart.desconto).toBe(0);
  });
});
