import { useState } from "react";
import Button from "@/components/ui/Button";
import { adminButtonClassName, adminLabelClassName } from "@/components/manager/adminClasses";
import type { ApiProduct, POSSaleItem } from "@/data/pos-types";
import { remainingPhysicalStock } from "@/lib/pos-catalog";
import { cn, formatCurrency } from "@/lib/utils";

interface VariantPickerProps {
  product: ApiProduct;
  sku: string;
  items: POSSaleItem[];
  onChange: (sku: string) => void;
}
const sizeOrder = ["PP", "P", "M", "G", "GG", "XG", "XGG"];
const colorLabel = (color: string | null) => color || "Padrão";
const sizeLabel = (size: string | null) => size || "Único";

export default function VariantPicker({ product, sku, items, onChange }: VariantPickerProps) {
  const [color, setColor] = useState(() => colorLabel((product.variants.find((variant) => remainingPhysicalStock(variant, items) > 0) ?? product.variants[0])?.cor ?? null));
  const colors = [...new Set(product.variants.map((variant) => colorLabel(variant.cor)))];
  const sizes = [...new Set(product.variants.map((variant) => sizeLabel(variant.tamanho)))].sort((a, b) => {
    const left = sizeOrder.indexOf(a.toUpperCase());
    const right = sizeOrder.indexOf(b.toUpperCase());
    return left >= 0 && right >= 0 ? left - right : a.localeCompare(b, "pt-BR", { numeric: true });
  });
  const selected = product.variants.find((variant) => variant.codigoSku === sku);
  if (product.variants.length === 0) return <p className="text-sm text-[var(--foreground-muted)]">Nenhuma variação cadastrada</p>;
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <fieldset className="min-w-0">
        <legend className={cn(adminLabelClassName, "mb-2")}>Cor</legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((value) => (
            <Button key={value} type="button" variant={color === value ? "action" : "outline-neutral"} size="sm" className={cn(adminButtonClassName, "min-w-0")} aria-pressed={color === value} onClick={() => { setColor(value); onChange(""); }}>{value}</Button>
          ))}
        </div>
      </fieldset>
      <fieldset className="min-w-0" aria-describedby="pdv-size-help">
        <legend className={cn(adminLabelClassName, "mb-2")}>Tamanho *</legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const candidates = product.variants.filter((variant) => colorLabel(variant.cor) === color && sizeLabel(variant.tamanho) === size);
            const variant = candidates.find((candidate) => remainingPhysicalStock(candidate, items) > 0);
            const available = !!variant;
            const checked = available && variant.codigoSku === sku;
            return (
              <Button key={size} type="button" variant={available ? "action" : "outline-neutral"} size="sm" disabled={!available} aria-pressed={checked} aria-label={"Tamanho " + size + (available ? "" : " — indisponível")} className={cn("min-h-11 min-w-11 rounded-[var(--radius-sm)] border px-3 py-2 text-sm disabled:bg-[var(--background-secondary)] disabled:text-[var(--foreground-muted)] disabled:opacity-100", checked ? "ring-2 ring-[var(--color-brand)] ring-offset-2" : "")} onClick={() => variant && onChange(variant.codigoSku)}>{size}</Button>
            );
          })}
        </div>
        <p id="pdv-size-help" className="mt-3 text-xs leading-[18px] text-[var(--foreground-muted)]">Preto: disponível na loja · Cinza: indisponível</p>
      </fieldset>
      {product.variants.some((variant) => !variant.stock) && <p role="status" className="text-xs text-[var(--color-warning-text)]">Não foi possível consultar o estoque de algumas variações. Tente recarregar o catálogo.</p>}
      {selected && <p className="break-words text-sm leading-[22px]" aria-live="polite">{selected.codigoSku} · {formatCurrency(selected.precoVariante ?? product.precoBase)} · {remainingPhysicalStock(selected, items)} disponível(is) na loja</p>}
    </div>
  );
}
