/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyModel = any;

import React from "react";

interface ColorSelectorProps {
  colors: AnyModel[];
  selectedColorCode: string | undefined;
  onSelectColor: (variant: AnyModel) => void;
}

export default function ColorSelector({
  colors,
  selectedColorCode,
  onSelectColor,
}: ColorSelectorProps) {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-[var(--foreground-secondary)] mb-3">
        Cor:{" "}
        <span className="text-[var(--foreground)] font-semibold">
          {selectedColorCode}
        </span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {colors.map((variant) => (
          <button
            key={variant.cor}
            onClick={() => onSelectColor(variant)}
            className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-full)] border transition-all duration-[var(--transition-fast)] ${
              selectedColorCode === variant.cor
                ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                : "bg-transparent border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)]"
            }`}
          >
            {variant.cor}
          </button>
        ))}
      </div>
    </div>
  );
}
