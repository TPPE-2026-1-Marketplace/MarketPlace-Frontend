import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMyReviewStatus, type MyReviewStatus } from "@/lib/catalog";
import { useMyReview } from "./useMyReview";

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  fetchMyReviewStatus: vi.fn(),
}));
const fetchMock = vi.mocked(fetchMyReviewStatus);

const podeAvaliar: MyReviewStatus = { avaliacao: null, podeAvaliar: true, motivo: "PODE_AVALIAR" };
const jaAvaliou: MyReviewStatus = {
  avaliacao: { idProduto: 7, nota: 4, comentario: "Bom", dataAvaliacao: "2026-10-01T10:00:00Z", dataEdicao: null },
  podeAvaliar: false,
  motivo: "JA_AVALIOU",
};

describe("useMyReview", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("não chama a API sem login", () => {
    const { result } = renderHook(() => useMyReview(7, false));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.status).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("carrega o estado do cliente quando há login", async () => {
    fetchMock.mockResolvedValueOnce(podeAvaliar);

    const { result } = renderHook(() => useMyReview(7, true));
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith(7);
    expect(result.current.status).toEqual(podeAvaliar);
    expect(result.current.error).toBeNull();
  });

  it("expõe o erro e se recupera no refetch", async () => {
    fetchMock.mockRejectedValueOnce(new Error("rede"));

    const { result } = renderHook(() => useMyReview(7, true));
    await waitFor(() => expect(result.current.error).toBe("Não foi possível verificar a sua avaliação."));
    expect(result.current.status).toBeNull();

    fetchMock.mockResolvedValueOnce(jaAvaliou);
    await act(() => result.current.refetch());

    expect(result.current.error).toBeNull();
    expect(result.current.status?.motivo).toBe("JA_AVALIOU");
  });

  it("volta a carregar ao trocar de produto, sem mostrar o estado do anterior", async () => {
    fetchMock.mockResolvedValueOnce(podeAvaliar).mockResolvedValueOnce(jaAvaliou);

    const { result, rerender } = renderHook(({ id }) => useMyReview(id, true), { initialProps: { id: 7 } });
    await waitFor(() => expect(result.current.status?.motivo).toBe("PODE_AVALIAR"));

    rerender({ id: 8 });
    expect(result.current.status).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.status?.motivo).toBe("JA_AVALIOU"));
    expect(fetchMock).toHaveBeenLastCalledWith(8);
  });
});
