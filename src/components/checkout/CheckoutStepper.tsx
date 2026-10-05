import { cn } from "@/lib/utils";
import type { CheckoutStep } from "@/types/checkout";

const STEPS: { key: CheckoutStep; label: string; mobileLabel?: string }[] = [
  { key: "dados", label: "Identificação", mobileLabel: "Dados" },
  { key: "entrega", label: "Entrega" },
  { key: "pagamento", label: "Pagamento" },
];

interface CheckoutStepperProps {
  current: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
  className?: string;
}

/** CheckoutStepper do Figma: a etapa atual fica em rosa (seleção/progresso). */
export default function CheckoutStepper({ current, onStepClick, className }: CheckoutStepperProps) {
  return (
    <nav
      aria-label="Etapas da compra"
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)] p-2",
        className,
      )}
    >
      <ol className="flex h-7 items-center justify-between">
        {STEPS.map((step, index) => {
          const isCurrent = step.key === current;
          return (
            <li key={step.key} className="lg:w-[145px]">
              <button
                type="button"
                onClick={() => onStepClick?.(step.key)}
                aria-current={isCurrent ? "step" : undefined}
                className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border text-xs leading-4 font-medium tracking-[0.5px]",
                    isCurrent
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-[var(--color-white)]"
                      : "border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-muted)]",
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "text-xs leading-4 font-medium tracking-[0.5px]",
                    isCurrent ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]",
                  )}
                >
                  {step.mobileLabel ? (
                    <>
                      <span className="lg:hidden">{step.mobileLabel}</span>
                      <span className="hidden lg:inline">{step.label}</span>
                    </>
                  ) : (
                    step.label
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
