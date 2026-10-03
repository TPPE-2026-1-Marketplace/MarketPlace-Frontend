import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchProducts, type Product } from "@/lib/catalog";
import { useProducts } from "./useProducts";

vi.mock("@/lib/catalog", () => ({ fetchProducts: vi.fn() }));
const fetchMock = vi.mocked(fetchProducts);

function product(id: number, titulo: string, categoria: string, skus: string[] = []): Product {
  return {
    idProduto: id,
    titulo,
    descricao: null,
    destaque: false,
    precoBase: 100,
    sku: `SKU-${id}`,
    categories: [{ nome: categoria }],
    variants: skus.map((codigoSku) => ({
      codigoSku,
      precoVariante: 100,
      ativo: true,
      cor: null,
      tamanho: null,
      images: [],
      stock: { qtdOnline: 0, qtdLojaFisica: 0 },
    })),
  };
}

const meta = { page: 1, limit: 20, total: 3, totalPages: 1 };
const catalog = [
  product(1, "Vestido Rosa", "Debutante", ["ROSA-P"]),
  product(2, "Vestido Azul", "Formatura"),
  product(3, "Saia Preta", "Festa", ["XPTO-M"]),
];

describe("useProducts", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ data: catalog, meta });
  });

  it("carrega os produtos e limita o tamanho da página a 100", async () => {
    const { result } = renderHook(() => useProducts({ page: 2, limit: 500 }));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith({ page: 2, limit: 100 });
    expect(result.current.products).toHaveLength(3);
    expect(result.current.meta).toEqual(meta);
    expect(result.current.error).toBeNull();
  });

  it("filtra por busca no título, no SKU do produto e no SKU da variante", async () => {
    const { result } = renderHook(() => useProducts({ busca: "  vestido " }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.products.map((p) => p.idProduto)).toEqual([1, 2]);

    act(() => result.current.setFilters({ busca: "sku-2" }));
    await waitFor(() => expect(result.current.products.map((p) => p.idProduto)).toEqual([2]));

    act(() => result.current.setFilters({ busca: "xpto" }));
    await waitFor(() => expect(result.current.products.map((p) => p.idProduto)).toEqual([3]));
  });

  it("filtra por categoria, ignorando maiúsculas e o valor all", async () => {
    const { result, rerender } = renderHook((filters) => useProducts(filters), {
      initialProps: { categoria: "formatura" } as { categoria: string },
    });
    await waitFor(() => expect(result.current.products.map((p) => p.idProduto)).toEqual([2]));

    rerender({ categoria: "all" });
    await waitFor(() => expect(result.current.products).toHaveLength(3));
    expect(result.current.filters).toEqual({ categoria: "all" });
  });

  it("expõe a mensagem de erro e limpa os dados quando a API falha", async () => {
    // Na montagem o hook busca duas vezes (o efeito de sincronizar filtros troca
    // a referência de `filters`), então a falha precisa valer para ambas.
    fetchMock.mockRejectedValue(new Error("API fora do ar"));

    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("API fora do ar");
    expect(result.current.products).toEqual([]);
    expect(result.current.meta).toBeNull();

    fetchMock.mockRejectedValue("falha sem Error");
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.error).toBe("Erro ao carregar produtos");
  });
});
