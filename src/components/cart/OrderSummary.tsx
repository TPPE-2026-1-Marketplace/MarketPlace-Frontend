import React, { useId } from "react";
import { cn, formatCurrency, formatItemCount } from "@/lib/utils";

interface OrderSummaryProps {
  itemCount: number;
  subtotal: number;
  /** `null` enquanto o frete ainda não foi calculado. */
  frete: number | null;
  freteLoading?: boolean;
  desconto: number;
  total: number;
  /** `cart`: total em Price Large (28px); `checkout`: total em KPI (24px). */
  variant?: "cart" | "checkout";
  note?: React.ReactNode;
  /** Ação dentro do card (ex.: "Finalizar a compra" no carrinho). */
  children?: React.ReactNode;
  className?: string;
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="leading-[22px] text-[var(--foreground-muted)]">{label}</span>
      <span className="leading-5 font-medium text-[var(--foreground)]">{children}</span>
    </div>
  );
}

/** OrderSummary do Figma, compartilhado por carrinho, checkout e confirmação. */
export default function OrderSummary({
  itemCount,
  subtotal,
  frete,
  freteLoading = false,
  desconto,
  total,
  variant = "checkout",
  note,
  children,
  className,
}: OrderSummaryProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] p-5",
        variant === "cart" ? "gap-3.5" : "gap-[15px]",
        className,
      )}
    >
      <h2 id={headingId} className="font-serif text-2xl leading-[31px] font-normal text-[var(--foreground)]">
        Resumo do pedido
      </h2>

      <SummaryRow label={`Subtotal (${formatItemCount(itemCount)})`}>{formatCurrency(subtotal)}</SummaryRow>
      <SummaryRow label="Frete">
        {freteLoading ? (
          <>
            <span
              className="block h-4 w-16 animate-pulse rounded bg-[var(--background-secondary)]"
              aria-hidden="true"
            />
            <span className="sr-only">Calculando frete</span>
          </>
        ) : frete === null ? (
          <span className="font-normal text-[var(--foreground-muted)]">A calcular</span>
        ) : frete === 0 ? (
          "Grátis"
        ) : (
          formatCurrency(frete)
        )}
      </SummaryRow>
      {desconto > 0 && (
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="leading-[22px] text-[var(--foreground-muted)]">Desconto</span>
          <span className="leading-5 font-medium text-[var(--color-success-text)]">
            − {formatCurrency(desconto)}
          </span>
        </div>
      )}

      <div className="h-px bg-[var(--border)]" />

      <div className="flex items-center justify-between gap-4 text-[var(--foreground)]">
        <span className="text-xl leading-7 font-semibold">Total</span>
        <span
          className={cn(
            variant === "cart" ? "text-[28px] leading-[34px] font-medium" : "text-2xl leading-8 font-semibold",
          )}
        >
          {formatCurrency(total)}
        </span>
      </div>

      {note && <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">{note}</p>}
      {children}
    </section>
  );
}
