import React from "react";
import { Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SizeOption {
  tamanho: string;
  disponivel?: boolean;
  stock?: number;
}

interface SizeSelectorProps {
  sizes: string[] | SizeOption[] | any[];
  selectedSize?: string;
  selectedSku?: string; // retrocompatibilidade
  onSelectSize: (size: string) => void;
  onOpenSizeGuide?: () => void;
  unavailableSizes?: string[];
  error?: string | null;
  className?: string;
}

export default function SizeSelector({
  sizes,
  selectedSize,
  selectedSku,
  onSelectSize,
  onOpenSizeGuide,
  unavailableSizes = [],
  error,
  className,
}: SizeSelectorProps) {
  if (!sizes || sizes.length === 0) return null;

  const activeSize = selectedSize ?? selectedSku ?? "";

  return (
    <div
      role="group"
      aria-label="Seleção de tamanho"
      className={cn("mb-5", className)}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[var(--foreground-secondary)] text-sm font-medium">Tamanho:</span>
          {activeSize && (
            <span className="text-[var(--foreground)] text-sm font-semibold">{activeSize}</span>
          )}
        </div>
        {onOpenSizeGuide && (
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline transition-colors cursor-pointer"
          >
            <Ruler className="w-3.5 h-3.5" />
            Ver medidas
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {sizes.map((item) => {
          const sizeName = typeof item === "string" ? item : item.tamanho;
          const isSelected = activeSize === sizeName;
          const isUnavailable =
            unavailableSizes.includes(sizeName) ||
            (typeof item === "object" && item.disponivel === false);

          return (
            <button
              key={sizeName}
              type="button"
              onClick={() => onSelectSize(sizeName)}
              disabled={isUnavailable}
              aria-label={sizeName}
              aria-pressed={isSelected}
              className={cn(
                "min-w-11 h-11 px-3 border text-sm font-medium rounded-[var(--radius-sm)] flex items-center justify-center transition-all",
                isSelected
                  ? "border-[var(--action-primary)] bg-[var(--action-primary)] text-[var(--color-white)] shadow-sm"
                  : "border-[var(--border)] text-[var(--foreground-secondary)] bg-[var(--background-card)] hover:border-[var(--border-control)] hover:text-[var(--foreground)]",
                isUnavailable && "opacity-40 cursor-not-allowed border-dashed line-through",
                error && !activeSize && "border-[var(--color-error)]",
              )}
            >
              {sizeName}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-[var(--color-error)] mt-1.5 font-medium">{error}</p>
      )}
    </div>
  );
}
