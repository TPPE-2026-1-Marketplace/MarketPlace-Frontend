import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMyReviewStatus, type MyReviewStatus } from "@/lib/catalog";

interface UseMyReviewResult {
  status: MyReviewStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Estado do cliente logado diante da avaliação do produto: a avaliação dele (se houver)
 * e se ele pode avaliar. Sem login (`enabled` falso) não chama a API.
 */
export function useMyReview(productId: number, enabled: boolean): UseMyReviewResult {
  const [status, setStatus] = useState<MyReviewStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Chave (produto) dos dados que estão no estado, para saber quando está carregando.
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latestRequest.current;
    try {
      const response = await fetchMyReviewStatus(productId);
      if (request !== latestRequest.current) return;
      setStatus(response);
      setError(null);
    } catch {
      if (request !== latestRequest.current) return;
      setStatus(null);
      setError("Não foi possível verificar a sua avaliação.");
    } finally {
      if (request === latestRequest.current) setLoadedFor(productId);
    }
  }, [productId]);

  useEffect(() => {
    if (!enabled) return;
    // Busca assíncrona: o setState de `load` só roda depois do await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [enabled, load]);

  const isStale = loadedFor !== productId;

  return {
    status: enabled && !isStale ? status : null,
    isLoading: enabled && isStale,
    error: enabled && !isStale ? error : null,
    refetch: load,
  };
}
