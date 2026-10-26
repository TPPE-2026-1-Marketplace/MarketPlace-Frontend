import React from "react";
import { ShoppingCart, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatCurrency, cn } from "@/lib/utils";

interface MobileStickyPurchaseBarProps {
  price: number;
  added: boolean;
  onAddToCart: () => void;
  isOutOfStock?: boolean;
  className?: string;
}

export function MobileStickyPurchaseBar({
  price,
  added,
  onAddToCart,
  isOutOfStock = false,
  className,
}: MobileStickyPurchaseBarProps) {
  const installments = price / 6;

  return (
    <div
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--background-card)] border-t border-[var(--border)] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 backdrop-blur-md bg-[var(--background-card)]/95",
        className,
      )}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider font-medium font-sans">
          Total
        </span>
        <span className="text-lg font-sans font-medium text-[var(--foreground)] truncate">
          {formatCurrency(price)}
        </span>
        <span className="text-[10px] text-[var(--foreground-muted)] truncate font-sans">
          6x de {formatCurrency(installments)} sem juros
        </span>
      </div>

      <div className="flex-1 max-w-[200px]">
        <Button
          type="button"
          onClick={onAddToCart}
          disabled={isOutOfStock}
          variant="action"
          size="sm"
          fullWidth
          className={cn(
            "h-11 text-xs sm:text-sm font-medium tracking-wide flex items-center justify-center gap-1.5 transition-all",
            added && "bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]",
          )}
        >
          {added ? (
            <>
              <Check className="size-4" />
              Item adicionado!
            </>
          ) : isOutOfStock ? (
            "Esgotado"
          ) : (
            <>
              <ShoppingCart className="size-4" />
              Adicionar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
