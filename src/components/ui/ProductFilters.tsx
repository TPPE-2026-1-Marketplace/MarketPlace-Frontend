import React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIAS, TIPOS as TIPOS_CATALOGO } from "@/lib/categories";

export const ALL_SIZES = [
  "PP", "P", "M", "G", "GG", "XG",
  "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58",
];

export const ALL_COLORS = [
  "Rosa", "Branco", "Azul Safira", "Vermelho", "Dourado", "Lilás",
  "Verde Esmeralda", "Preto", "Champagne", "Nude", "Bordô", "Lavanda",
];

export const COLOR_SWATCHES: Record<string, string> = {
  "rosa": "bg-pink-300",
  "rosa antigo": "bg-[var(--color-brand-light)]",
  "azul": "bg-blue-500",
  "azul marinho": "bg-blue-900",
  "azul safira": "bg-blue-600",
  "preto": "bg-neutral-900",
  "branco": "bg-white border-neutral-300",
  "verde": "bg-emerald-600",
  "verde esmeralda": "bg-emerald-700",
  "vermelho": "bg-red-600",
  "dourado": "bg-amber-300",
  "marsala": "bg-rose-900",
  "lilás": "bg-purple-300",
  "champagne": "bg-amber-100",
  "nude": "bg-amber-50",
  "bordô": "bg-red-950",
  "lavanda": "bg-purple-200",
};

export interface ProductFiltersProps {
  category?: string;
  onSelectCategory?: (category: string) => void;
  tipo?: string;
  onSelectTipo?: (tipo: string) => void;
  priceRange?: [number, number];
  onPriceRangeChange?: (range: [number, number]) => void;
  selectedSizes?: string[];
  onToggleSize?: (size: string) => void;
  selectedColors?: string[];
  onToggleColor?: (color: string) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  categories?: Array<{ value: string; label: string }>;
  tipos?: Array<{ value: string; label: string }>;
  sizes?: string[];
  colors?: string[];
  className?: string;
  isMobile?: boolean;
}

export default function ProductFilters({
  tipo = "all",
  onSelectTipo = () => {},
  priceRange = [0, 5000],
  onPriceRangeChange = () => {},
  selectedSizes = [],
  onToggleSize = () => {},
  selectedColors = [],
  onToggleColor = () => {},
  hasActiveFilters = false,
  onClearFilters = () => {},
  tipos = [{ value: "all", label: "Todos" }, ...TIPOS_CATALOGO],
  sizes = ALL_SIZES,
  colors = ALL_COLORS,
  className,
  isMobile = false,
}: ProductFiltersProps) {
  return (
    <div
      className={cn(
        "bg-[var(--background-card)] font-sans",
        !isMobile && "p-5 border border-[var(--border)] rounded-[var(--radius-lg)] shadow-xs",
        className,
      )}
    >
      {/* Título e Ação de Limpeza */}
      {!isMobile && (
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-[var(--color-brand)]" />
            Filtros
          </h3>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="size-3" /> Limpar
            </button>
          )}
        </div>
      )}

      {/* Seção: Comprimento */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-3">
          Comprimento
        </h4>
        <div className="space-y-2">
          {tipos.map((t) => (
            <label
              key={t.value}
              className="flex items-center gap-2.5 cursor-pointer text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors select-none"
            >
              <input
                type="radio"
                name={isMobile ? "tipo-mobile" : "tipo"}
                value={t.value}
                checked={tipo === t.value}
                onChange={() => onSelectTipo(t.value)}
                className="accent-[var(--action-primary)] size-4 cursor-pointer"
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Seção: Faixa de Preço */}
      <div className="mb-6 pt-5 border-t border-[var(--border)]">
        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-3">
          Preço
        </h4>
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={priceRange[1]}
            onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-[var(--action-primary)] cursor-pointer"
            aria-label="Filtrar por preço máximo"
          />
          <div className="flex justify-between items-center text-xs font-medium text-[var(--foreground-secondary)]">
            <span>R$ {priceRange[0].toLocaleString("pt-BR")}</span>
            <span>R$ {priceRange[1].toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </div>

      {/* Seção: Tamanho */}
      <div className="mb-6 pt-5 border-t border-[var(--border)]">
        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-3">
          Tamanho
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => {
            const isSelected = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => onToggleSize(size)}
                className={cn(
                  "min-w-10 h-9 px-2.5 border text-xs font-medium rounded-[var(--radius-sm)] transition-all cursor-pointer flex items-center justify-center",
                  isSelected
                    ? "bg-[var(--action-primary)] text-[var(--color-white)] border-[var(--action-primary)] shadow-xs"
                    : "border-[var(--border)] text-[var(--foreground-secondary)] bg-[var(--background-card)] hover:border-[var(--border-control)] hover:text-[var(--foreground)]",
                )}
                aria-pressed={isSelected}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção: Cor */}
      <div className="pt-5 border-t border-[var(--border)]">
        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-3">
          Cor
        </h4>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {colors.map((color) => {
            const isSelected = selectedColors.includes(color);
            const swatch = COLOR_SWATCHES[color.toLowerCase()] ?? "bg-neutral-400";
            return (
              <label
                key={color}
                className="flex items-center gap-2.5 cursor-pointer text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors select-none py-0.5"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleColor(color)}
                  className="accent-[var(--action-primary)] size-4 rounded-[var(--radius-xs)] cursor-pointer"
                />
                <span
                  className={cn("size-3 rounded-full border border-black/10 shrink-0", swatch)}
                  aria-hidden="true"
                />
                <span>{color}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
