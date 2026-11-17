import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type { DiscardGuard } from "@/hooks/useDiscardGuard";

interface DiscardChangesAlertProps {
  readonly message?: string;
  readonly continueLabel?: string;
  readonly discardLabel?: string;
  readonly onContinue: () => void;
  readonly onDiscard: () => void;
  readonly className?: string;
}

/** Alerta padronizado de confirmação antes de descartar alterações não salvas. */
export function DiscardChangesAlert({
  message = "Você tem alterações não salvas. Deseja descartá-las?",
  continueLabel = "Continuar editando",
  discardLabel = "Descartar alterações",
  onContinue,
  onDiscard,
  className,
}: Readonly<DiscardChangesAlertProps>) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-error)] bg-[var(--background-error-subtle)] p-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-xs font-medium text-[var(--color-error-text)]">{message}</p>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="outline-neutral"
          size="sm"
          className="rounded-[var(--radius-sm)] px-3 py-1.5 text-xs"
          onClick={onContinue}
        >
          {continueLabel}
        </Button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-[var(--radius-sm)] bg-[var(--color-error)] px-3 py-1.5 text-xs font-medium text-[var(--color-white)] transition-opacity hover:opacity-90"
        >
          {discardLabel}
        </button>
      </div>
    </div>
  );
}
