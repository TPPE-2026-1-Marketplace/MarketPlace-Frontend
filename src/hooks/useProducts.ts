
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

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{data: Product[], meta: any}>("/products", filters as any).then(res => res).catch(() => ({ data: [], meta: {} }) as any);
      setProducts(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos");
      setProducts([]);
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
