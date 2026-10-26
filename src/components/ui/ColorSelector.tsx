import React from "react";
import { cn } from "@/lib/utils";

export interface ColorOption {
  cor: string;
  hex?: string;
  disponivel?: boolean;
}

interface ColorSelectorProps {
  colors: string[] | ColorOption[] | any[];
  selectedColor?: string;
  selectedColorCode?: string; // retrocompatibilidade
  onSelectColor: (color: string) => void;
  unavailableColors?: string[];
  error?: string | null;
  className?: string;
}

// Mapeamento de cores conhecidas para visual swatch
const COLOR_SWATCHES: Record<string, string> = {
  "rosa": "bg-pink-300",
  "rosa antigo": "bg-[#e8b4b8]",
  "azul": "bg-blue-500",
  "azul marinho": "bg-blue-900",
  "preto": "bg-neutral-900",
  "branco": "bg-white border-neutral-300",
  "verde": "bg-emerald-600",
  "vermelho": "bg-red-600",
  "dourado": "bg-amber-300",
  "marsala": "bg-rose-900",
};

export default function ColorSelector({
  colors,
  selectedColor,
  selectedColorCode,
  onSelectColor,
  unavailableColors = [],
  error,
  className,
}: ColorSelectorProps) {
  if (!colors || colors.length === 0) return null;

  const activeColor = selectedColor ?? selectedColorCode ?? "";

  return (
    <div
      role="group"
      aria-label="Seleção de cor"
      className={cn("mb-5", className)}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[var(--foreground-secondary)] text-sm font-medium">Cor:</span>
        {activeColor && (
          <span className="text-[var(--foreground)] text-sm font-semibold">{activeColor}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {colors.map((item) => {
          const colorName = typeof item === "string" ? item : item.cor;
          const isSelected = activeColor === colorName;
          const isUnavailable =
            unavailableColors.includes(colorName) ||
            (typeof item === "object" && item.disponivel === false);

          const swatchClass = COLOR_SWATCHES[colorName.toLowerCase()] ?? "bg-neutral-400";

          return (
            <button
              key={colorName}
              type="button"
              onClick={() => onSelectColor(colorName)}
              disabled={isUnavailable}
              aria-label={colorName}
              aria-pressed={isSelected}
              className={cn(
                "group relative flex items-center gap-2 px-3.5 py-1.5 border text-sm rounded-[var(--radius-sm)] transition-all",
                isSelected
                  ? "border-[var(--action-primary)] bg-[var(--action-primary)] text-[var(--color-white)] shadow-sm font-medium"
                  : "border-[var(--border)] text-[var(--foreground-secondary)] bg-[var(--background-card)] hover:border-[var(--border-control)] hover:text-[var(--foreground)]",
                isUnavailable && "opacity-40 cursor-not-allowed border-dashed line-through",
                error && !activeColor && "border-[var(--color-error)]",
              )}
            >
              <span
                className={cn(
                  "size-3 rounded-full border border-black/10 shrink-0",
                  swatchClass,
                  isSelected && "ring-1 ring-white/50",
                )}
                aria-hidden="true"
              />
              <span>{colorName}</span>
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
