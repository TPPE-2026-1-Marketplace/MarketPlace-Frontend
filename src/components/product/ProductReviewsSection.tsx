import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  author: string;
  title: string;
  comment: string;
  rating: number;
  verified: boolean;
}

const FIGMA_SAMPLE_REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Mariana L.",
    title: "Produto impecável",
    comment: "O vestido chegou no prazo e ficou perfeito. A equipe ajudou com as medidas.",
    rating: 5,
    verified: true,
  },
];

interface ProductReviewsSectionProps {
  className?: string;
}

export function ProductReviewsSection({ className }: ProductReviewsSectionProps) {
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
            Avaliações dos clientes (327)
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-1 font-sans">
            Opiniões reais de clientes que compraram e usaram nossos vestidos
          </p>
        </div>

        {/* Resumo da Nota Média (Figma 4.8 de 5 em Inter Semi Bold) */}
        <div className="flex items-center gap-3 bg-[var(--background-secondary)] px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)]">
          <span className="text-[28px] leading-[34px] font-sans font-semibold text-[var(--foreground)]">
            4,8
          </span>
          <div>
            <div className="flex items-center gap-1 text-[var(--action-primary)]">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="size-4 fill-[var(--action-primary)] text-[var(--action-primary)]"
                />
              ))}
            </div>
            <span className="text-xs font-sans text-[var(--foreground-secondary)] mt-0.5 block">
              de 5 · 327 avaliações
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Avaliações Conforme o Protótipo */}
      <div className="space-y-4">
        {FIGMA_SAMPLE_REVIEWS.map((review) => (
          <div
            key={review.id}
            className="p-5 rounded-[var(--radius-lg)] bg-[var(--background-secondary)]/40 border border-[var(--border)] space-y-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium font-sans text-[var(--foreground)]">
                {review.author}
              </span>
              {review.verified && (
                <span className="text-xs font-sans text-[var(--foreground-muted)]">
                  Compra verificada
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[var(--action-primary)]">
              {Array.from({ length: review.rating }).map((_, idx) => (
                <Star
                  key={idx}
                  className="size-3.5 fill-[var(--action-primary)] text-[var(--action-primary)]"
                />
              ))}
            </div>

            <p className="text-sm font-medium font-sans text-[var(--foreground)]">
              {review.title}
            </p>

            <p className="text-sm font-sans text-[var(--foreground-secondary)] leading-relaxed">
              {review.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
