import { ImageOff } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import type { ApiProduct } from "@/data/pos-types";
import { cn } from "@/lib/utils";

export default function ProductPhoto({ product, sku, className }: { product: ApiProduct; sku?: string; className?: string }) {
  const variants = sku ? product.variants.filter((variant) => variant.codigoSku === sku) : product.variants;
  const image = variants.flatMap((variant) => variant.images ?? [])[0];
  return (
    <div className={cn("flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--background-secondary)]", className)}>
      {image ? <ImageWithFallback key={image.url} src={image.url} alt={product.titulo} className="h-full w-full object-cover" loading="lazy" /> : (
        <div className="flex flex-col items-center gap-2 p-3 text-center text-xs text-[var(--foreground-muted)]">
          <ImageOff className="size-6" aria-hidden="true" /><span>Sem foto</span>
        </div>
      )}
    </div>
  );
}
