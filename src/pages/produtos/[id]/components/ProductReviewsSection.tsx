import React from "react";
import { Star, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

const SAMPLE_REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Mariana L.",
    rating: 5,
    date: "14 de março de 2026",
    comment:
      "O vestido é deslumbrante! Tecido encorpado, bordados impecáveis e caimento sob medida. Usei em um baile de gala e recebi elogios a noite toda. Super recomendo a DK Fashion!",
    verified: true,
  },
  {
    id: "r2",
    author: "Beatriz M.",
    rating: 5,
    date: "02 de fevereiro de 2026",
    comment:
      "Chegou super rápido aqui em Brasília. Segui a tabela de medidas do site e deu certinho. A cor é idêntica à das fotos.",
    verified: true,
  },
];

interface ProductReviewsSectionProps {
  className?: string;
}

export function ProductReviewsSection({ className }: ProductReviewsSectionProps) {
  return (
    <div className={cn("bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 lg:p-8 mb-12 shadow-sm", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--border)]">
        <div>
          <h2 className="text-xl lg:text-2xl font-serif text-[var(--foreground)] font-normal">
            Avaliações dos clientes (327)
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Opiniões reais de clientes que compraram e usaram nossos vestidos
          </p>
        </div>

        {/* Resumo da Nota Média (Figma 4.8 de 5) */}
        <div className="flex items-center gap-3 bg-[var(--background-secondary)] px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border)]">
          <span className="text-2xl font-serif font-bold text-[var(--foreground)]">4,8</span>
          <div>
            <div className="flex items-center gap-0.5 text-amber-500">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="size-3.5 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <span className="text-[11px] text-[var(--foreground-muted)]">de 5 · 327 avaliações</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {SAMPLE_REVIEWS.map((review) => (
          <div
            key={review.id}
            className="p-4 rounded-[var(--radius-md)] bg-[var(--background-secondary)]/50 border border-[var(--border)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">{review.author}</span>
                {review.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-success-text)] font-medium">
                    <CheckCircle className="size-3 text-[var(--color-success)]" />
                    Compradora verificada
                  </span>
                )}
              </div>
              <span className="text-xs text-[var(--foreground-subtle)]">{review.date}</span>
            </div>

            <div className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={cn(
                    "size-3",
                    idx < review.rating
                      ? "fill-amber-500 text-amber-500"
                      : "text-[var(--border-control)]",
                  )}
                />
              ))}
            </div>

            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
              "{review.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
