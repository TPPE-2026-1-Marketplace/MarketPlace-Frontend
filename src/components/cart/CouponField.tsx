import React, { useId, useState } from "react";
import Button from "@/components/ui/Button";
import { useCoupon } from "@/hooks/useCoupon";
import { cn, formatCurrency } from "@/lib/utils";

/** Componente Coupon do Figma: estados padrão, aplicado, erro e carregando. */
export default function CouponField({ className }: { className?: string }) {
  const { appliedCode, discount, apply, remove, loading, error, clearError } = useCoupon();
  const [code, setCode] = useState("");
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await apply(code)) setCode("");
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p id={labelId} className="text-sm leading-5 font-medium text-[var(--foreground)]">
        Cupom de desconto
      </p>

      {appliedCode ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-brand)] bg-[var(--background-card)] p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-sm leading-5 font-semibold text-[var(--color-brand)]">
              {appliedCode} aplicado
            </p>
            <p className="text-xs leading-[18px] text-[var(--color-success-text)]">
              Você economizou {formatCurrency(discount)}
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            className="text-xs leading-4 font-medium tracking-[0.5px] text-[var(--color-brand)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            Remover<span className="sr-only"> cupom {appliedCode}</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                if (error) clearError();
              }}
              placeholder="Digite o código"
              autoComplete="off"
              aria-labelledby={labelId}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={cn(
                "h-10 w-full min-w-0 flex-1 rounded-[var(--radius-md)] border bg-[var(--background-card)] px-3 text-sm leading-[22px] text-[var(--foreground)]",
                "placeholder:text-[var(--foreground-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-accent)]",
                error ? "border-[var(--color-brand)]" : "border-[var(--border)]",
              )}
            />
            <Button type="submit" variant="action" loading={loading} className="h-10 px-6 py-0 text-base">
              {loading ? "Carregando..." : "Aplicar"}
            </Button>
          </div>
          {error && (
            <p id={errorId} role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
