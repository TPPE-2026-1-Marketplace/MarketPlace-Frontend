"use client";

import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface ProductFiltersProps {
  filters: {
    categoria?: string;
    busca?: string;
    minPrice?: number;
    maxPrice?: number;
  };
  onFiltersChange: (filters: ProductFiltersProps["filters"]) => void;
  categories?: string[];
}

const DEFAULT_CATEGORIES = ["debutante", "formatura", "casamento", "festa"];

export default function ProductFilters({
  filters,
  onFiltersChange,
  categories = DEFAULT_CATEGORIES,
}: ProductFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  const hasActiveFilters = filters.categoria || filters.busca || filters.minPrice || filters.maxPrice;

  const clearFilters = () => {
    onFiltersChange({});
  };

  const filtersContent = (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
        />
        <input
          type="text"
          placeholder="Buscar vestidos..."
          value={filters.busca ?? ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, busca: e.target.value || undefined })
          }
          className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
        />
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--foreground-muted)] mb-3">
          Categoria
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  categoria: filters.categoria === cat ? undefined : cat,
                })
              }
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-[var(--radius-full)] border transition-all duration-[var(--transition-fast)] capitalize",
                filters.categoria === cat
                  ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-[var(--foreground)]"
                  : "bg-transparent border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)]",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--foreground-muted)] mb-3">
          Faixa de preço
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
          <span className="text-[var(--foreground-subtle)] text-sm">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" fullWidth onClick={clearFilters}>
          <X size={14} />
          Limpar filtros
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <SlidersHorizontal size={16} />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 w-2 h-2 rounded-full bg-[var(--color-brand)]" />
          )}
        </Button>
      </div>

      {/* Mobile filters drawer */}
      {showMobileFilters && (
        <div className="lg:hidden mb-6 p-5 rounded-[var(--radius-lg)] bg-[var(--background-card)] border border-[var(--border)] animate-scale-in">
          {filtersContent}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-[calc(var(--header-height)+2rem)] p-5 rounded-[var(--radius-lg)] bg-[var(--background-card)] border border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-5 flex items-center gap-2">
            <SlidersHorizontal size={16} />
            Filtros
          </h2>
          {filtersContent}
        </div>
      </aside>
    </>
  );
}
