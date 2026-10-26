import React from "react";
import ProductCard from "@/components/ui/ProductCard";
import { getDisplayVariant, type Product } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface ProductRelatedSectionProps {
  products: Product[];
  className?: string;
}

export function ProductRelatedSection({ products, className }: ProductRelatedSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className={cn("mb-16", className)}>
      <h2
        className="text-[var(--foreground)] mb-6 font-serif text-2xl font-normal"
        style={{ letterSpacing: "-0.02em" }}
      >
        Você também pode gostar
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p) => {
          const variant = getDisplayVariant(p);
          return (
            <ProductCard
              key={p.idProduto}
              id={p.idProduto}
              titulo={p.titulo}
              preco={variant?.precoVariante ?? p.precoBase}
              imagem={variant?.images[0]?.url || "/hero-dress.png"}
              categoria={p.categories[0]?.nome}
              variant={variant}
            />
          );
        })}
      </div>
    </div>
  );
}
