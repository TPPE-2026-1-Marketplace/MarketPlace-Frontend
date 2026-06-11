"use client";

import React, { useState } from "react";
import { Ruler } from "lucide-react";
import type { ProductVariant } from "@/models";

interface SizeSelectorProps {
  sizes: ProductVariant[];
  selectedSku: string | undefined;
  onSelectSize: (variant: ProductVariant) => void;
}

export default function SizeSelector({
  sizes,
  selectedSku,
  onSelectSize,
}: SizeSelectorProps) {
  if (!sizes || sizes.length <= 1) return null;

  const selectedVariant = sizes.find((s) => s.codigo_sku === selectedSku);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[var(--foreground-secondary)]">
          Tamanho:{" "}
          <span className="text-[var(--foreground)] font-semibold">
            {selectedVariant?.tamanho}
          </span>
        </h3>
        <button className="flex items-center gap-1 text-xs text-[var(--color-brand)] hover:text-[var(--color-brand-dark)] transition-colors underline">
          <Ruler size={12} />
          Guia de tamanhos
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((variant) => (
          <button
            key={variant.codigo_sku}
            onClick={() => onSelectSize(variant)}
            className={`w-12 h-12 text-sm font-medium rounded-[var(--radius-md)] border transition-all duration-[var(--transition-fast)] ${
              selectedSku === variant.codigo_sku
                ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                : "bg-transparent border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)]"
            }`}
          >
            {variant.tamanho}
          </button>
        ))}
      </div>
    </div>
  );
}
