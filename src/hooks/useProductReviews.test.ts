import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProductReviews, type ProductReviewsResponse } from "@/lib/catalog";
import { useProductReviews } from "./useProductReviews";

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  getProductReviews: vi.fn(),
}));
const fetchMock = vi.mocked(getProductReviews);

function review(nota: number, nome: string) {
  return { idProduto: 7, nota, comentario: `Comentário de ${nome}`, dataAvaliacao: "2026-10-01T10:00:00Z", cliente: { nome } };
}

function pageOf(
  data: ReturnType<typeof review>[],
  page: number,
  totalPages: number,
  extra: Partial<ProductReviewsResponse> = {},
): ProductReviewsResponse {
  return {
    data,
    meta: { page, limit: 2, total: 4, totalPages },
    media: 4.5,
    totalAvaliacoes: 4,
    distribuicao: { "1": 0, "2": 0, "3": 0, "4": 2, "5": 2 },
    ...extra,
  };
}

describe("useProductReviews", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("carrega a primeira página com média, total e distribuição", async () => {
    fetchMock.mockResolvedValueOnce(pageOf([review(5, "Ana"), review(4, "Bia")], 1, 2));

    const { result } = renderHook(() => useProductReviews(7, 2));
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith(7, 1, 2);
    expect(result.current.reviews.map((r) => r.cliente.nome)).toEqual(["Ana", "Bia"]);
    expect(result.current.media).toBe(4.5);
    expect(result.current.totalAvaliacoes).toBe(4);
    expect(result.current.distribuicao["5"]).toBe(2);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("loadMore acrescenta a próxima página e encerra quando acabam as páginas", async () => {
    fetchMock
      .mockResolvedValueOnce(pageOf([review(5, "Ana"), review(4, "Bia")], 1, 2))
      .mockResolvedValueOnce(pageOf([review(5, "Caio"), review(4, "Duda")], 2, 2));

    const { result } = renderHook(() => useProductReviews(7, 2));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.loadMore());
    expect(result.current.isLoadingMore).toBe(true);

    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));
    expect(fetchMock).toHaveBeenLastCalledWith(7, 2, 2);
    expect(result.current.reviews.map((r) => r.cliente.nome)).toEqual(["Ana", "Bia", "Caio", "Duda"]);
    expect(result.current.hasMore).toBe(false);

    act(() => result.current.loadMore());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("expõe o erro e se recupera no refetch", async () => {
    fetchMock.mockRejectedValueOnce(new Error("rede"));

    const { result } = renderHook(() => useProductReviews(7, 2));
    await waitFor(() => expect(result.current.error).toBe("Não foi possível carregar as avaliações."));
    expect(result.current.reviews).toEqual([]);

    fetchMock.mockResolvedValueOnce(pageOf([review(5, "Ana")], 1, 1));
    await act(() => result.current.refetch());

    expect(result.current.error).toBeNull();
    expect(result.current.reviews).toHaveLength(1);
  });

  it("refetch volta para a primeira página e atualiza a nota média", async () => {
    fetchMock
      .mockResolvedValueOnce(pageOf([review(5, "Ana"), review(4, "Bia")], 1, 2))
      .mockResolvedValueOnce(pageOf([review(5, "Caio"), review(4, "Duda")], 2, 2))
      .mockResolvedValueOnce(pageOf([review(3, "Eva")], 1, 1, { media: 3, totalAvaliacoes: 1 }));

    const { result } = renderHook(() => useProductReviews(7, 2));
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.reviews).toHaveLength(4));

    await act(() => result.current.refetch());

    expect(result.current.reviews.map((r) => r.cliente.nome)).toEqual(["Eva"]);
    expect(result.current.media).toBe(3);
    expect(result.current.totalAvaliacoes).toBe(1);
  });

  it("descarta a resposta atrasada de um produto anterior", async () => {
    let resolveFirst: (value: ProductReviewsResponse) => void = () => {};
    fetchMock
      .mockImplementationOnce(() => new Promise<ProductReviewsResponse>((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce(pageOf([review(2, "Novo")], 1, 1, { media: 2, totalAvaliacoes: 1 }));

    const { result, rerender } = renderHook(({ id }) => useProductReviews(id, 2), { initialProps: { id: 7 } });
    rerender({ id: 8 });
    await waitFor(() => expect(result.current.reviews.map((r) => r.cliente.nome)).toEqual(["Novo"]));

    await act(async () => resolveFirst(pageOf([review(5, "Antigo")], 1, 1)));

    expect(result.current.reviews.map((r) => r.cliente.nome)).toEqual(["Novo"]);
    expect(result.current.media).toBe(2);
  });
});
