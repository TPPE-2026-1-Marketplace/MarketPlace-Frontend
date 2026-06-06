"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductService } from "@/services";
import type { Product, ProductFilters } from "@/models";
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
      const response = await ProductService.getProducts(filters);
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
