export type { CatalogImage, Product, ProductVariant } from "@/lib/catalog";
export interface ProductFilters {
  categoria?: string;
  busca?: string;
  page?: number;
  limit?: number;
}

import { useState, useEffect, useCallback } from "react";
import type { PaginatedResponse } from "@/lib/api";
import { fetchProducts as fetchCatalogProducts, type Product } from "@/lib/catalog";

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  meta: PaginatedResponse<Product>["meta"] | null;
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
  refetch: () => void;
}

export function useProducts(initialFilters?: ProductFilters): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginatedResponse<Product>["meta"] | null>(null);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters ?? {});

  // Keep internal filters in sync when the caller passes new filters (category/search/page changes)
  const initialFiltersKey = JSON.stringify(initialFilters ?? {});
  useEffect(() => {
    setFilters(initialFilters ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiltersKey]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchCatalogProducts({
        page: filters.page,
        limit: Math.min(filters.limit ?? 20, 100),
      });
      const busca = filters.busca?.trim().toLocaleLowerCase("pt-BR");
      const categoria = filters.categoria?.trim().toLocaleLowerCase("pt-BR");
      const filtered = response.data.filter((product) => {
        const matchesSearch =
          !busca ||
          product.titulo.toLocaleLowerCase("pt-BR").includes(busca) ||
          product.sku.toLocaleLowerCase("pt-BR").includes(busca) ||
          product.variants.some((variant) =>
            variant.codigoSku.toLocaleLowerCase("pt-BR").includes(busca),
          );
        const matchesCategory =
          !categoria ||
          categoria === "all" ||
          product.categories.some(
            (item) => item.nome.toLocaleLowerCase("pt-BR") === categoria,
          );
        return matchesSearch && matchesCategory;
      });

      setProducts(filtered);
      setMeta(response.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos");
      setProducts([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    meta,
    filters,
    setFilters,
    refetch: fetchProducts,
  };
}
