import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { POSSaleItem } from "../data/pos-types";
import { api } from "../lib/api";
import { POSProvider, usePOS } from "./POSContext";

vi.mock("../lib/api", () => ({ api: { post: vi.fn() } }));
const postMock = vi.mocked(api.post);

const wrapper = ({ children }: { children: ReactNode }) => <POSProvider>{children}</POSProvider>;

function item(variantSku: string, quantity: number, unitPrice: number): POSSaleItem {
  return {
    product: { idProduto: 1, titulo: "Vestido", descricao: null, precoBase: unitPrice, sku: "V", variants: [] },
    variantSku,
    size: "M",
    color: "Preto",
    quantity,
    unitPrice,
  };
}

describe("POSContext", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("exige o POSProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => usePOS())).toThrow("usePOS must be used within POSProvider");
  });

  it("monta a venda atual somando itens repetidos", () => {
    const { result } = renderHook(() => usePOS(), { wrapper });

    act(() => result.current.addItem(item("A", 1, 100)));
    act(() => result.current.addItem(item("A", 2, 100)));
    act(() => result.current.addItem(item("B", 1, 50)));
    expect(result.current.currentSale.map((i) => [i.variantSku, i.quantity])).toEqual([
      ["A", 3],
      ["B", 1],
    ]);

    act(() => result.current.updateQuantity(1, 4));
    expect(result.current.currentSale[1].quantity).toBe(4);

    act(() => result.current.updateQuantity(0, 0));
    expect(result.current.currentSale.map((i) => i.variantSku)).toEqual(["B"]);

    act(() => result.current.removeItem(0));
    expect(result.current.currentSale).toEqual([]);

    act(() => result.current.addItem(item("C", 1, 10)));
    act(() => result.current.clearSale());
    expect(result.current.currentSale).toEqual([]);
  });

  it("não finaliza venda vazia", async () => {
    const { result } = renderHook(() => usePOS(), { wrapper });

    await expect(result.current.completeSale("pix", "ANA01")).resolves.toEqual({
      success: false,
      message: "Carrinho vazio",
    });
    expect(postMock).not.toHaveBeenCalled();
  });

  it("finaliza a venda na API e registra no histórico do vendedor", async () => {
    postMock.mockResolvedValueOnce({ idPedido: 42 });
    const { result } = renderHook(() => usePOS(), { wrapper });
    act(() => result.current.addItem(item("A", 2, 100)));

    let response: Awaited<ReturnType<typeof result.current.completeSale>> | undefined;
    await act(async () => {
      response = await result.current.completeSale("card", "ANA01", "Maria", "123.456.789-00", "61", "m@dk.com");
    });

    expect(response).toEqual({ success: true, saleId: "42" });
    expect(postMock).toHaveBeenCalledWith("/orders/in-store", {
      codigoVendedor: "ANA01",
      idUsuario: "12345678900",
      clienteNomeAvulso: "Maria",
      items: [{ variantSku: "A", quantidade: 2 }],
      couponNumero: null,
    });
    expect(result.current.currentSale).toEqual([]);
    expect(result.current.sales[0]).toMatchObject({
      id: "42",
      subtotal: 200,
      total: 200,
      paymentMethod: "card",
      customerName: "Maria",
    });
    expect(result.current.getSalesBySeller("ANA01")).toHaveLength(1);
    expect(result.current.getSalesBySeller("OUTRO")).toHaveLength(0);
    expect(result.current.getTotalSales()).toBe(200);
  });

  it("envia cliente avulso sem CPF e devolve o erro da API", async () => {
    const { result } = renderHook(() => usePOS(), { wrapper });
    act(() => result.current.addItem(item("A", 1, 10)));

    postMock.mockRejectedValueOnce(new Error("Estoque insuficiente"));
    await expect(result.current.completeSale("dinheiro", "X")).resolves.toEqual({
      success: false,
      message: "Estoque insuficiente",
    });
    expect(postMock.mock.calls[0][1]).toMatchObject({ idUsuario: null, clienteNomeAvulso: null });

    postMock.mockRejectedValueOnce({});
    await expect(result.current.completeSale("pix", "X")).resolves.toEqual({
      success: false,
      message: "Erro ao processar a venda na API",
    });
  });
});
