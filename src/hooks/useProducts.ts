
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

/**
 * Maps a backend Product (camelCase fields, categories array) to
 * the frontend Product shape (snake_case fields, categoria string).
 */
function normalizeBackendProduct(raw: Record<string, unknown>): Product {
  const idProduto = (raw.idProduto ?? raw.id_produto ?? 0) as number;
  const categories = raw.categories as Array<{ nome: string }> | undefined;
  const variants = raw.variants as ProductVariant[] | undefined;

  return {
    id_produto: idProduto,
    titulo: (raw.titulo as string) ?? '',
    preco_base: (raw.precoBase ?? raw.preco_base ?? 0) as number,
    descricao: (raw.descricao as string) ?? undefined,
    categoria: categories?.[0]?.nome ?? null,
    imagem_url: null, // Backend atual não retorna imagem_url direta no produto
    categories,
    variants: variants?.length ? variants : [
      {
        id: idProduto,
        preco_variante: (raw.precoBase ?? raw.preco_base ?? 0) as number,
      },
    ],
  };
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
      const response = await api.get<PaginatedResponse<Record<string, unknown>>>("/products", filters as any);

      // Normalise backend products from camelCase to frontend snake_case format
      const normalised = (response.data ?? []).map(normalizeBackendProduct);

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
