import { useCallback, useEffect, useRef, useState } from "react";
import {
  getProductReviews,
  type ProductReview,
  type ProductReviewsResponse,
} from "@/lib/catalog";

export type ReviewsDistribution = ProductReviewsResponse["distribuicao"];

const EMPTY_DISTRIBUTION: ReviewsDistribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

interface UseProductReviewsResult {
  reviews: ProductReview[];
  /** Nota média do produto (0 quando não há avaliações). */
  media: number;
  totalAvaliacoes: number;
  distribuicao: ReviewsDistribution;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  /** Carrega a próxima página e acrescenta ao fim da lista. */
  loadMore: () => void;
  /** Recarrega a primeira página (ex.: depois de criar, editar ou remover). */
  refetch: () => Promise<void>;
}

export function useProductReviews(productId: number, pageSize = 10): UseProductReviewsResult {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState({
    media: 0,
    totalAvaliacoes: 0,
    distribuicao: EMPTY_DISTRIBUTION,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Produto cujos dados estão no estado. Enquanto for diferente do atual, o hook
  // está carregando e não mostra a lista do produto anterior.
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  // Descarta respostas atrasadas (troca de produto, refetch durante um "ver mais").
  const latestRequest = useRef(0);

  const load = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      const request = ++latestRequest.current;
      try {
        const response = await getProductReviews(productId, targetPage, pageSize);
        if (request !== latestRequest.current) return;
        setReviews((previous) =>
          mode === "append" ? [...previous, ...response.data] : response.data,
        );
        setSummary({
          media: response.media,
          totalAvaliacoes: response.totalAvaliacoes,
          distribuicao: response.distribuicao,
        });
        setPage(response.meta.page);
        setTotalPages(response.meta.totalPages);
        setError(null);
      } catch {
        if (request !== latestRequest.current) return;
        setError("Não foi possível carregar as avaliações.");
      } finally {
        if (request === latestRequest.current) {
          setLoadedFor(productId);
          setIsLoadingMore(false);
        }
      }
    },
    [productId, pageSize],
  );

  useEffect(() => {
    // Busca assíncrona: o setState de `load` só roda depois do await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1, "replace");
  }, [load]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    void load(page + 1, "append");
  }, [isLoadingMore, page, totalPages, load]);

  const refetch = useCallback(() => load(1, "replace"), [load]);

  const isStale = loadedFor !== productId;

  return {
    reviews: isStale ? [] : reviews,
    media: isStale ? 0 : summary.media,
    totalAvaliacoes: isStale ? 0 : summary.totalAvaliacoes,
    distribuicao: isStale ? EMPTY_DISTRIBUTION : summary.distribuicao,
    isLoading: isStale,
    isLoadingMore,
    error: isStale ? null : error,
    hasMore: !isStale && page < totalPages,
    loadMore,
    refetch,
  };
}
