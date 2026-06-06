import { api, type PaginatedResponse } from "@/lib/api";
import type { Product, Category, ProductFilters } from "@/models";

export const ProductService = {
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const params: Record<string, string | number | undefined> = {};

    if (filters) {
      if (filters.categoria) params.categoria = filters.categoria;
      if (filters.busca) params.busca = filters.busca;
      if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
      if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
      params.page = filters.page ?? 1;
      params.limit = filters.limit ?? 20;
    }

    return api.get<PaginatedResponse<Product>>("/products", params);
  },

  async getProductById(id: number): Promise<Product> {
    return api.get<Product>(`/products/${id}`);
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await api.get<PaginatedResponse<Product>>("/products", {
      destaque: "true",
      limit: 8,
    });
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    return api.get<Category[]>("/categories");
  },
};
