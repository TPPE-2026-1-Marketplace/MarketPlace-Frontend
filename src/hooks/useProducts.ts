
export interface CatalogImage {
  id: number;
  url: string;
}
export interface ProductVariant {
  id: number;
  preco_variante?: number;
  images?: { image: CatalogImage }[];
  cor?: string;
  tamanho?: string;
}
export interface Product {
  id_produto: number;
  titulo: string;
  preco_base: number;
  descricao?: string;
  categoria?: string | null;
  imagem_url?: string | null;
  variants?: ProductVariant[];
  categories?: { nome: string }[];
}
export interface ProductFilters {
  categoria?: string;
  busca?: string;
  page?: number;
  limit?: number;
}

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/api";

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
      const response = await api.get<PaginatedResponse<Product>>("/products", filters as any);

      // Normalise backend products: the API may return a flat Product entity
      // (without variants/categories), so we enrich the shape here to keep
      // downstream components working.
      const normalised = (response.data ?? []).map((p) => {
        // If the backend already returns variants, keep them.
        if (p.variants && p.variants.length > 0) return p;

        // Otherwise, synthesise a minimal variant & categories array from the
        // flat entity fields so that ProductCard / details can render correctly.
        return {
          ...p,
          categories: p.categories ?? (p.categoria ? [{ nome: p.categoria }] : []),
          variants: p.variants ?? [
            {
              id: p.id_produto,
              preco_variante: p.preco_base,
              images: p.imagem_url
                ? [{ image: { id: p.id_produto, url: p.imagem_url } }]
                : [],
            },
          ],
        };
      });

      setProducts(normalised);
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
