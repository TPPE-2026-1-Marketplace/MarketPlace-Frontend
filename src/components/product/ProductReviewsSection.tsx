import React from "react";
import { Star, MessageSquare } from "lucide-react";
import type { ProductReview } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface ProductReviewsSectionProps {
  reviews?: ProductReview[];
  averageRating?: number;
  totalReviews?: number;
  className?: string;
}

export function ProductReviewsSection({
  reviews = [],
  averageRating = 0,
  totalReviews = 0,
  className,
}: ProductReviewsSectionProps) {
  const hasReviews = totalReviews > 0 && reviews.length > 0;
  const formattedRating = averageRating.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div
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

      {/* Lista de Avaliações Conforme a API */}
      {hasReviews ? (
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
