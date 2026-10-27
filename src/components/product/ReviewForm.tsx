import React, { useState } from "react";
import { Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const REVIEW_COMMENT_MAX_LENGTH = 2000;

const RATING_LABELS = ["Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

export interface ReviewFormValues {
  nota: number;
  comentario: string;
}

interface ReviewFormProps {
  /** Valores iniciais (modo edição). Sem eles, o formulário começa vazio. */
  initialValues?: ReviewFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  /** Erro devolvido pela API, mostrado acima dos botões. */
  error?: string | null;
  onSubmit: (values: ReviewFormValues) => void;
  onCancel?: () => void;
}

export function ReviewForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  error = null,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [nota, setNota] = useState(initialValues?.nota ?? 0);
  const [comentario, setComentario] = useState(initialValues?.comentario ?? "");
  const [ratingError, setRatingError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (nota < 1) {
      setRatingError("Escolha uma nota de 1 a 5 estrelas.");
      return;
    }
    setRatingError(null);
    onSubmit({ nota, comentario: comentario.trim() });
  }

  function chooseRating(value: number) {
    setNota(value);
    setRatingError(null);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Formulário de avaliação">
      <div>
        <span id="review-rating-label" className="block text-sm font-sans font-medium text-[var(--foreground)] mb-2">
          Sua nota
        </span>
        <div role="radiogroup" aria-labelledby="review-rating-label" className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const checked = value === nota;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}: ${RATING_LABELS[value - 1]}`}
                // Navegação por setas: só a estrela marcada (ou a primeira) entra na ordem de tab.
                tabIndex={checked || (nota === 0 && value === 1) ? 0 : -1}
                onClick={() => chooseRating(value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault();
                    chooseRating(Math.min(5, (nota || 0) + 1));
                  } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault();
                    chooseRating(Math.max(1, (nota || 2) - 1));
                  }
                }}
                className="p-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--action-primary)]"
              >
                <Star
                  className={cn(
                    "size-7",
                    value <= nota
                      ? "fill-[var(--action-primary)] text-[var(--action-primary)]"
                      : "text-[var(--border-control)]",
                  )}
                />
              </button>
            );
          })}
          {nota > 0 && (
            <span className="ml-2 text-sm font-sans text-[var(--foreground-secondary)]" aria-live="polite">
              {RATING_LABELS[nota - 1]}
            </span>
          )}
        </div>
        {ratingError && (
          <p role="alert" className="mt-2 text-sm font-sans text-[var(--feedback-error,#b3261e)]">
            {ratingError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="review-comment" className="block text-sm font-sans font-medium text-[var(--foreground)] mb-2">
          Comentário <span className="font-normal text-[var(--foreground-muted)]">(opcional)</span>
        </label>
        <Textarea
          id="review-comment"
          value={comentario}
          maxLength={REVIEW_COMMENT_MAX_LENGTH}
          rows={4}
          placeholder="Conte como foi o caimento, o tecido e a sua experiência com o vestido."
          onChange={(event) => setComentario(event.target.value)}
        />
        <p className="mt-1 text-xs font-sans text-[var(--foreground-muted)] text-right" aria-live="off">
          {comentario.length}/{REVIEW_COMMENT_MAX_LENGTH}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm font-sans text-[var(--feedback-error,#b3261e)]">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
