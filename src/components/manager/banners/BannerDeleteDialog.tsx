import Button from "@/components/ui/Button";

/** Modal de confirmação para exclusão permanente de um banner. */
export function BannerDeleteDialog({
  bannerTitle,
  onConfirm,
  onCancel,
}: Readonly<{
  bannerTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4">
      <div className="w-full max-w-sm rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-lg">
        <h4 className="mb-2 text-base font-semibold text-[var(--foreground)]">
          Remover banner
        </h4>
        <p className="mb-5 text-sm leading-5 text-[var(--foreground-secondary)]">
          Tem certeza que deseja remover{" "}
          <strong className="font-semibold text-[var(--foreground)]">"{bannerTitle}"</strong>? Esta
          ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline-neutral"
            size="sm"
            className="flex-1 rounded-[var(--radius-sm)] py-2.5"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-[var(--radius-sm)] bg-[var(--color-error)] py-2.5 text-sm font-medium text-[var(--color-white)] transition-opacity hover:opacity-90"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}
