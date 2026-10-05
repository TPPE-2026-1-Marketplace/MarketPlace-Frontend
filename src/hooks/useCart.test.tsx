import React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { calculateCart, CartProvider, useCart, type Cart } from "./useCart";
import { makeCartItem, seedCart } from "@/test/renderWithProviders";

const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;

function baseCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: 1,
    items: [
      makeCartItem({ sku: "A", preco: 899.9 }),
      makeCartItem({ sku: "B", idProduto: 2, preco: 749.9 }),
    ],
    subtotal: 0,
    desconto: 0,
    total: 0,
    ...overrides,
  };
}

describe("calculateCart", () => {
  it("soma preço × quantidade no subtotal", () => {
    const cart = calculateCart(
      baseCart({ items: [makeCartItem({ sku: "A", preco: 899.9, quantity: 2 }), makeCartItem({ sku: "B", preco: 749.9 })] }),
    );
    expect(cart.subtotal).toBe(2549.7);
    expect(cart.total).toBe(2549.7);
  });

  it("usa o preço da variante quando existir", () => {
    const item = makeCartItem({ preco: 100 });
    item.variant.precoVariante = 80;
    expect(calculateCart(baseCart({ items: [item] })).subtotal).toBe(80);
  });

  it("aplica cupom percentual", () => {
    const cart = calculateCart(baseCart({ cupomPercentual: 10 }));
    expect(cart.desconto).toBe(164.98);
    expect(cart.total).toBe(1484.82);
  });

  it("limita o cupom fixo ao subtotal", () => {
    const cart = calculateCart(baseCart({ items: [makeCartItem({ preco: 50 })], cupomFixo: 100 }));
    expect(cart.desconto).toBe(50);
    expect(cart.total).toBe(0);
  });

  it("inclui o frete no total (exemplo do Figma)", () => {
    const cart = calculateCart(baseCart({ cupomFixo: 100, frete: 24.9 }));
    expect(cart.subtotal).toBe(1649.8);
    expect(cart.total).toBe(1574.7);
  });

  it("ignora o frete quando o carrinho está vazio", () => {
    expect(calculateCart(baseCart({ items: [], frete: 24.9 })).total).toBe(0);
  });
});

describe("useCart", () => {
  it("adiciona, soma quantidades e remove itens", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const item = makeCartItem();

    act(() => result.current.addItem(item.variant, 1));
    act(() => result.current.addItem(item.variant, 2));
    expect(result.current.cart.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(3);

    act(() => result.current.removeItem(item.variant.codigoSku));
    expect(result.current.cart.items).toHaveLength(0);
  });

  it("remove o item quando a quantidade chega a zero", () => {
    seedCart([makeCartItem({ quantity: 2 })]);
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.updateQuantity("VPR-M", 1));
    expect(result.current.cart.items[0].quantity).toBe(1);
    act(() => result.current.updateQuantity("VPR-M", 0));
    expect(result.current.cart.items).toHaveLength(0);
  });

  it("guarda o frete e o soma ao total", () => {
    seedCart([makeCartItem({ preco: 100 })]);
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.setShipping({ cep: "70000000", valor: 24.9, prazoDias: 3 }));
    expect(result.current.cart).toMatchObject({ cep: "70000000", frete: 24.9, prazoDias: 3, total: 124.9 });

    act(() => result.current.setShipping(null));
    expect(result.current.cart).toMatchObject({ cep: null, frete: 0, total: 100 });
  });

  it("aplica e remove cupom", () => {
    seedCart([makeCartItem({ preco: 200 })]);
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.applyCoupon("DK20", 20, 0));
    expect(result.current.cart).toMatchObject({ cupom: "DK20", desconto: 40, total: 160 });

    act(() => result.current.applyCoupon(null, 0, 0));
    expect(result.current.cart).toMatchObject({ cupom: null, desconto: 0, total: 200 });
  });

  it("persiste no localStorage e limpa tudo com clear", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(makeCartItem().variant));
    expect(JSON.parse(localStorage.getItem("cart") ?? "{}").items).toHaveLength(1);

    act(() => result.current.clear());
    expect(JSON.parse(localStorage.getItem("cart") ?? "{}").items).toHaveLength(0);
  });

  it("carrega carrinhos salvos antes da cotação de frete", () => {
    localStorage.setItem("cart", JSON.stringify({ id: 1, items: [makeCartItem({ preco: 100 })] }));
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cart).toMatchObject({ cep: null, frete: 0, subtotal: 100, total: 100 });
  });

  it("ignora dados corrompidos", () => {
    localStorage.setItem("cart", "{corrompido");
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cart.items).toEqual([]);
  });
});
