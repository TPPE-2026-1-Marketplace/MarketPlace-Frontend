import React from "react";
import { Star, MessageSquare } from "lucide-react";
import type { ProductReview } from "@/lib/catalog";
import type { ReviewsDistribution } from "@/hooks/useProductReviews";
import { cn } from "@/lib/utils";

interface ProductReviewsSectionProps {
  reviews?: ProductReview[];
  averageRating?: number;
  totalReviews?: number;
  /** Quantidade de avaliações por nota (1 a 5), para o resumo em barras. */
  distribution?: ReviewsDistribution;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

const STARS_DESC = [5, 4, 3, 2, 1] as const;

export function ProductReviewsSection({
  reviews = [],
  averageRating = 0,
  totalReviews = 0,
  distribution,
  isLoading = false,
  error = null,
  onRetry,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  className,
}: ProductReviewsSectionProps) {
  const hasReviews = totalReviews > 0 && reviews.length > 0;
  const formattedRating = averageRating.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div
      data-testid="product-reviews"
      className={cn(
        "bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 lg:p-8 mb-12 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--border)]">
        <div>
          <h2 className="text-xl lg:text-2xl font-serif text-[var(--foreground)] font-normal">
            Avaliações dos clientes ({totalReviews})
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-1 font-sans">
            Opiniões reais de clientes que compraram e usaram nossos vestidos
          </p>
        </div>

        {/* Resumo da Nota Média */}
        <div className="flex items-center gap-3 bg-[var(--background-secondary)] px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] self-start sm:self-auto">
          <span className="text-[28px] leading-[34px] font-sans font-semibold text-[var(--foreground)]">
            {hasReviews ? formattedRating : "—"}
          </span>
          <div>
            <div className="flex items-center gap-1 text-[var(--action-primary)]">
              {[1, 2, 3, 4, 5].map((i) => {
                const isFilled = hasReviews && i <= Math.round(averageRating);
                return (
                  <Star
                    key={i}
                    className={cn(
                      "size-4",
                      isFilled
                        ? "fill-[var(--action-primary)] text-[var(--action-primary)]"
                        : "text-[var(--border-control)]",
                    )}
                  />
                );
              })}
            </div>
            <span className="text-xs font-sans text-[var(--foreground-secondary)] mt-0.5 block">
              {hasReviews ? `de 5 · ${totalReviews} avaliações` : "Nenhuma nota ainda"}
            </span>
          </div>
        </div>
      </div>

      {/* Distribuição das notas */}
      {hasReviews && distribution && (
        <ul
          aria-label="Distribuição das notas"
          className="mb-6 pb-6 border-b border-[var(--border)] space-y-1.5"
        >
          {STARS_DESC.map((stars) => {
            const count = distribution[String(stars) as keyof ReviewsDistribution] ?? 0;
            const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <li key={stars} className="flex items-center gap-3 text-xs font-sans">
                <span className="w-10 shrink-0 text-[var(--foreground-secondary)]">
                  {stars} {stars === 1 ? "estrela" : "estrelas"}
                </span>
                <div
                  className="h-2 flex-1 rounded-full bg-[var(--background-secondary)] overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-[var(--action-primary)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[var(--foreground-muted)]">
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Lista de Avaliações Conforme a API */}
      {isLoading ? (
        <p className="py-10 text-center text-sm font-sans text-[var(--foreground-muted)]">
          Carregando avaliações...
        </p>
      ) : error ? (
        <div role="alert" className="py-10 text-center text-sm font-sans">
          <p className="text-[var(--foreground-secondary)]">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 underline text-[var(--foreground)]"
            >
              Tentar novamente
            </button>
          )}
        </div>
      ) : hasReviews ? (
        <>
          <div className="space-y-4">
            {reviews.map((review, idx) => {
              const author = review.cliente?.nome || "Cliente";
              const formattedDate = review.dataAvaliacao
                ? new Date(review.dataAvaliacao).toLocaleDateString("pt-BR")
                : null;

              return (
                <div
                  key={`${review.idProduto}-${idx}`}
                  className="p-5 rounded-[var(--radius-lg)] bg-[var(--background-secondary)]/40 border border-[var(--border)] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium font-sans text-[var(--foreground)]">
                        {author}
                      </span>
                      {review.compraVerificada && (
                        <span className="text-xs font-sans text-[var(--foreground-muted)]">
                          Compra verificada
                        </span>
                      )}
                    </div>
                    {formattedDate && (
                      <span className="text-xs font-sans text-[var(--foreground-subtle)]">
                        {formattedDate}
                        {review.dataEdicao ? " · editada" : ""}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[var(--action-primary)]">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={cn(
                          "size-3.5",
                          starIdx <= review.nota
                            ? "fill-[var(--action-primary)] text-[var(--action-primary)]"
                            : "text-[var(--border-control)]",
                        )}
                      />
                    ))}
                  </div>

                  {review.comentario && (
                    <p className="text-sm font-sans text-[var(--foreground-secondary)] leading-relaxed">
                      {review.comentario}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {hasMore && onLoadMore && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="px-5 py-2.5 text-sm font-sans border border-[var(--border-control)] rounded-[var(--radius-lg)] text-[var(--foreground)] hover:bg-[var(--background-secondary)] disabled:opacity-60"
              >
                {isLoadingMore ? "Carregando..." : "Ver mais avaliações"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-10 text-center flex flex-col items-center justify-center text-[var(--foreground-muted)]">
          <MessageSquare className="size-8 stroke-1 mb-2 text-[var(--foreground-subtle)]" />
          <p className="text-sm font-sans font-medium text-[var(--foreground-secondary)]">
            Este produto ainda não possui avaliações.
          </p>
          <p className="text-xs font-sans text-[var(--foreground-muted)] mt-1">
            Seja a primeira a avaliar após a sua compra!
          </p>
        </div>
      )}
    </div>
  );
}
