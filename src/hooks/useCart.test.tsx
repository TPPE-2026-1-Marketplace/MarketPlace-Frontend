import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { CartProvider, useCart, type CartItem } from "./useCart";

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

function variant(codigoSku: string, precoBase: number, precoVariante?: number): CartItem["variant"] {
  return { codigoSku, precoVariante, produto: { idProduto: 1, titulo: codigoSku, precoBase } };
}

describe("useCart (carrinho da API)", () => {
  it("exige o CartProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCart())).toThrow("useCart must be used within <CartProvider>");
  });

  it("adiciona itens, soma quantidades e calcula o subtotal", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(variant("A", 100)));
    act(() => result.current.addItem(variant("A", 100), 2));
    act(() => result.current.addItem(variant("B", 100, 50)));

    expect(result.current.cart.items.map((i) => [i.variant.codigoSku, i.quantity])).toEqual([
      ["A", 3],
      ["B", 1],
    ]);
    expect(result.current.cart.subtotal).toBe(350);
    expect(result.current.cart.total).toBe(350);
    expect(result.current.itemCount).toBe(4);
  });

  it("atualiza e remove itens", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(variant("A", 10)));
    act(() => result.current.addItem(variant("B", 20)));

    act(() => result.current.updateQuantity("A", 5));
    expect(result.current.cart.subtotal).toBe(70);

    act(() => result.current.updateQuantity("A", 0));
    expect(result.current.cart.items.map((i) => i.variant.codigoSku)).toEqual(["B"]);

    act(() => result.current.removeItem("B"));
    expect(result.current.cart.items).toEqual([]);
    expect(result.current.cart.total).toBe(0);
  });

  it("aplica cupom percentual e cupom fixo limitado ao subtotal", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(variant("A", 200)));

    act(() => result.current.applyCoupon("DK10", 10));
    expect(result.current.cart).toMatchObject({ cupom: "DK10", desconto: 20, total: 180 });

    act(() => result.current.applyCoupon("FIXO", 0, 500));
    expect(result.current.cart).toMatchObject({ cupom: "FIXO", desconto: 200, total: 0 });

    act(() => result.current.applyCoupon(null));
    expect(result.current.cart).toMatchObject({ cupom: null, desconto: 0, total: 200 });
  });

  it("persiste no localStorage e restaura na próxima montagem", () => {
    const first = renderHook(() => useCart(), { wrapper });
    act(() => first.result.current.addItem(variant("A", 30), 2));
    first.unmount();

    expect(JSON.parse(localStorage.getItem("cart") ?? "{}").subtotal).toBe(60);
    const second = renderHook(() => useCart(), { wrapper });
    expect(second.result.current.itemCount).toBe(2);
  });

  it("ignora carrinho corrompido no localStorage", () => {
    localStorage.setItem("cart", "{quebrado");

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.cart.items).toEqual([]);
  });

  it("limpa o carrinho via clear() e pelo evento global clear-cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(variant("A", 10)));
    act(() => result.current.clear());
    expect(result.current.itemCount).toBe(0);

    act(() => result.current.addItem(variant("A", 10)));
    act(() => {
      window.dispatchEvent(new Event("clear-cart"));
    });
    expect(result.current.itemCount).toBe(0);
  });
});
