import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PRODUCTS } from "../data/products";
import { CartProvider, useCart } from "./CartContext";

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;
const [vestido, outro] = PRODUCTS;

describe("CartContext (carrinho local)", () => {
  it("exige o CartProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCart())).toThrow("useCart must be used within CartProvider");
  });

  it("agrupa itens por produto, tamanho e cor", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(vestido, "38", "Rosa"));
    act(() => result.current.addItem(vestido, "38", "Rosa", 2));
    act(() => result.current.addItem(vestido, "40", "Rosa"));
    act(() => result.current.addItem(outro, "38", "Rosa"));

    expect(result.current.items.map((i) => [i.product.id, i.size, i.quantity])).toEqual([
      [vestido.id, "38", 3],
      [vestido.id, "40", 1],
      [outro.id, "38", 1],
    ]);
    expect(result.current.count).toBe(5);
    expect(result.current.total).toBeCloseTo(vestido.price * 4 + outro.price);
  });

  it("atualiza, remove e limpa itens", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(vestido, "38", "Rosa"));
    act(() => result.current.addItem(outro, "40", "Azul"));

    act(() => result.current.updateQuantity(vestido.id, "38", "Rosa", 4));
    expect(result.current.items[0].quantity).toBe(4);

    act(() => result.current.updateQuantity(vestido.id, "38", "Rosa", 0));
    expect(result.current.items.map((i) => i.product.id)).toEqual([outro.id]);

    act(() => result.current.removeItem(outro.id, "40", "Azul"));
    expect(result.current.items).toEqual([]);

    act(() => result.current.addItem(outro, "40", "Azul"));
    act(() => result.current.clearCart());
    expect(result.current.count).toBe(0);
    expect(result.current.total).toBe(0);
  });
});
