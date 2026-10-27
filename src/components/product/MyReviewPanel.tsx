import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useMyReview } from "@/hooks/useMyReview";
import { ApiError } from "@/lib/api";
import {
  createReview,
  deleteMyReview,
  updateReview,
  type MyReview,
  type MyReviewStatus,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ReviewForm, type ReviewFormValues } from "./ReviewForm";

interface MyReviewPanelProps {
  productId: number;
  /** Chamado depois de criar, editar ou remover, para recarregar a lista e a nota média. */
  onChanged?: () => void | Promise<void>;
}

const NO_PURCHASE_MESSAGE = "Só quem comprou e pagou por este produto pode avaliá-lo.";

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sua sessão expirou. Entre novamente para avaliar.";
    if (error.status === 403) return NO_PURCHASE_MESSAGE;
    if (error.status === 404) return "Não encontramos a sua avaliação.";
    if (error.status === 409) return "Você já avaliou este produto.";
    if (error.status === 400) return "Confira a nota e o comentário e tente de novo.";
  }
  return "Não foi possível concluir. Tente novamente em instantes.";
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      aria-label="Sua avaliação"
      className="mb-6 p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-secondary)]/40"
    >
      <h3 className="text-base font-sans font-medium text-[var(--foreground)] mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1 text-[var(--action-primary)]" aria-label={`Sua nota: ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "size-4",
            star <= value ? "fill-[var(--action-primary)] text-[var(--action-primary)]" : "text-[var(--border-control)]",
          )}
        />
      ))}
    </div>
  );
}

function OwnReview({ review }: { review: MyReview }) {
  const date = new Date(review.dataAvaliacao).toLocaleDateString("pt-BR");
  return (
    <div className="space-y-2">
      <Stars value={review.nota} />
      {review.comentario && (
        <p className="text-sm font-sans text-[var(--foreground-secondary)] leading-relaxed">{review.comentario}</p>
      )}
      <p className="text-xs font-sans text-[var(--foreground-subtle)]">
        Avaliado em {date}
        {review.dataEdicao ? " · editada" : ""}
      </p>
    </div>
  );
}

export function MyReviewPanel({ productId, onChanged }: MyReviewPanelProps) {
  const { isAuthenticated } = useAuth();
  const { status, isLoading, error: loadError, refetch } = useMyReview(productId, isAuthenticated);

  const [editing, setEditing] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: () => Promise<void>, onSuccess?: () => void) {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await action();
      onSuccess?.();
      await refetch();
      await onChanged?.();
    } catch (error) {
      setActionError(messageFor(error));
      // 409: a avaliação já existe; atualiza o estado para mostrar a que está salva.
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        await refetch();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const create = (values: ReviewFormValues) =>
    run(() => createReview(productId, { nota: values.nota, comentario: values.comentario || undefined }));

  const edit = (values: ReviewFormValues) =>
    run(
      // Comentário vazio na edição remove o texto: o backend trata "" como limpar.
      () => updateReview(productId, { nota: values.nota, comentario: values.comentario }),
      () => setEditing(false),
    );

  const remove = () => run(() => deleteMyReview(productId), () => setConfirmingRemoval(false));

  if (!isAuthenticated) {
    return (
      <Frame title="Avalie este produto">
        <p className="text-sm font-sans text-[var(--foreground-secondary)]">
          <Link to="/login" className="underline text-[var(--foreground)]">
            Entre na sua conta
          </Link>{" "}
          para avaliar este produto. Só quem comprou e pagou pode deixar uma avaliação.
        </p>
      </Frame>
    );
  }

  if (isLoading) {
    return (
      <Frame title="Sua avaliação">
        <p className="text-sm font-sans text-[var(--foreground-muted)]">Verificando a sua avaliação...</p>
      </Frame>
    );
  }

  if (loadError || !status) {
    return (
      <Frame title="Sua avaliação">
        <div role="alert" className="text-sm font-sans">
          <p className="text-[var(--foreground-secondary)]">{loadError ?? "Não foi possível verificar a sua avaliação."}</p>
          <button type="button" onClick={() => void refetch()} className="mt-2 underline text-[var(--foreground)]">
            Tentar novamente
          </button>
        </div>
      </Frame>
    );
  }

  return (
    <PanelBody
      status={status}
      editing={editing}
      confirmingRemoval={confirmingRemoval}
      isSubmitting={isSubmitting}
      actionError={actionError}
      onCreate={create}
      onEdit={edit}
      onRemove={remove}
      onStartEdit={() => {
        setActionError(null);
        setEditing(true);
      }}
      onCancelEdit={() => {
        setActionError(null);
        setEditing(false);
      }}
      onAskRemoval={() => {
        setActionError(null);
        setConfirmingRemoval(true);
      }}
      onCancelRemoval={() => setConfirmingRemoval(false)}
    />
  );
}

interface PanelBodyProps {
  status: MyReviewStatus;
  editing: boolean;
  confirmingRemoval: boolean;
  isSubmitting: boolean;
  actionError: string | null;
  onCreate: (values: ReviewFormValues) => void;
  onEdit: (values: ReviewFormValues) => void;
  onRemove: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onAskRemoval: () => void;
  onCancelRemoval: () => void;
}

function PanelBody({
  status,
  editing,
  confirmingRemoval,
  isSubmitting,
  actionError,
  onCreate,
  onEdit,
  onRemove,
  onStartEdit,
  onCancelEdit,
  onAskRemoval,
  onCancelRemoval,
}: PanelBodyProps) {
  if (status.motivo === "SEM_COMPRA_VERIFICADA") {
    return (
      <Frame title="Avalie este produto">
        <p className="text-sm font-sans text-[var(--foreground-secondary)]">{NO_PURCHASE_MESSAGE}</p>
      </Frame>
    );
  }

  if (status.motivo === "PODE_AVALIAR") {
    return (
      <Frame title="Avalie este produto">
        <ReviewForm submitLabel="Publicar avaliação" isSubmitting={isSubmitting} error={actionError} onSubmit={onCreate} />
      </Frame>
    );
  }

  const review = status.avaliacao;
  if (!review) return null;

  if (editing) {
    return (
      <Frame title="Editar sua avaliação">
        <ReviewForm
          initialValues={{ nota: review.nota, comentario: review.comentario ?? "" }}
          submitLabel="Salvar alterações"
          isSubmitting={isSubmitting}
          error={actionError}
          onSubmit={onEdit}
          onCancel={onCancelEdit}
        />
      </Frame>
    );
  }

  return (
    <Frame title="Sua avaliação">
      <OwnReview review={review} />
      {actionError && (
        <p role="alert" className="mt-3 text-sm font-sans text-[var(--feedback-error,#b3261e)]">
          {actionError}
        </p>
      )}
      {confirmingRemoval ? (
        <div className="mt-4 space-y-3" role="alertdialog" aria-label="Confirmar remoção">
          <p className="text-sm font-sans text-[var(--foreground)]">
            Remover a sua avaliação? Essa ação não pode ser desfeita.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" loading={isSubmitting} onClick={onRemove}>
              Remover avaliação
            </Button>
            <Button size="sm" variant="ghost" disabled={isSubmitting} onClick={onCancelRemoval}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button size="sm" variant="outline" onClick={onStartEdit}>
            Editar
          </Button>
          <Button size="sm" variant="ghost" onClick={onAskRemoval}>
            Remover
          </Button>
        </div>
      )}
    </Frame>
  );
}
