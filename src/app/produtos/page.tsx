"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PackageSearch } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import ProductFilters from "@/components/ui/ProductFilters";
import Pagination from "@/components/ui/Pagination";
import { useProducts } from "@/hooks/useProducts";
import type { ProductFilters as ProductFiltersType } from "@/models";

const SKELETON_COUNT = 8;

function ProductCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden bg-[var(--background-card)] border border-[var(--border)]">
      <div className="aspect-[3/4] skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-3 skeleton w-16" />
        <div className="h-4 skeleton w-3/4" />
        <div className="h-5 skeleton w-1/2 mt-2" />
      </div>
    </div>
  );
}

function ProdutosContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ProductFiltersType>({
    categoria: searchParams.get("categoria") ?? undefined,
    busca: searchParams.get("busca") ?? undefined,
    page: 1,
    limit: 20,
  });

  // Sync URL search params changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categoria: searchParams.get("categoria") ?? undefined,
      busca: searchParams.get("busca") ?? undefined,
      page: 1,
    }));
  }, [searchParams]);

  const { products, isLoading, error, meta } = useProducts(filters);

  const handleFiltersChange = (newFilters: Omit<ProductFiltersType, "page" | "limit">) => {
    setFilters({ ...newFilters, page: 1, limit: 20 });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-10 animate-fade-in">
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-brand)]">
            Coleção completa
          </span>
          <h1 className="text-3xl sm:text-4xl font-light text-white mt-2">
            Todos os{" "}
            <span className="font-semibold text-gradient">Vestidos</span>
          </h1>
          {meta && (
            <p className="text-sm text-[var(--foreground-muted)] mt-2">
              {meta.total} {meta.total === 1 ? "vestido encontrado" : "vestidos encontrados"}
            </p>
          )}
        </div>

        {/* Layout */}
        <div className="flex gap-8">
          {/* Sidebar / mobile filters */}
          <ProductFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {error ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
                <PackageSearch size={48} className="text-[var(--foreground-subtle)] mb-4" />
                <h2 className="text-xl font-medium text-[var(--foreground-secondary)]">
                  Erro ao carregar produtos
                </h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-2">{error}</p>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
                <PackageSearch size={48} className="text-[var(--foreground-subtle)] mb-4" />
                <h2 className="text-xl font-medium text-[var(--foreground-secondary)]">
                  Nenhum vestido encontrado
                </h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-2">
                  Tente ajustar os filtros para encontrar o que procura.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {products.map((product, index) => {
                    const firstVariant = product.variants?.[0];
                    const firstImage =
                      firstVariant?.images?.[0]?.image?.url ?? "/hero-dress.png";
                    const categoria = product.categories?.[0]?.nome;

                    return (
                      <ProductCard
                        key={product.id_produto}
                        id={product.id_produto}
                        titulo={product.titulo}
                        preco={firstVariant?.preco_variante ?? product.preco_base}
                        imagem={firstImage}
                        categoria={categoria}
                        className="animate-slide-up"
                        style={{ animationDelay: `${(index % 8) * 50}ms` } as React.CSSProperties}
                      />
                    );
                  })}
                </div>

                {meta && meta.totalPages > 1 && (
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProdutosContent />
    </Suspense>
  );
}
