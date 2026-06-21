import { api, type PaginatedResponse } from "@/lib/api";

export interface CatalogImage {
  idImagem: number;
  url: string;
  ordem: number;
  descricao: string | null;
}

interface CatalogImageLinkResponse {
  idImagem: number;
  codigoSku: string;
  ordemNoCatalogo: number;
  image: CatalogImage;
}

interface StockResponse {
  qtdOnline: number;
  qtdLojaFisica: number;
}

export interface ProductVariant {
  codigoSku: string;
  precoVariante: number;
  ativo: boolean;
  cor: string | null;
  tamanho: string | null;
  images: CatalogImage[];
  stock: StockResponse;
}

export interface Product {
  idProduto: number;
  titulo: string;
  descricao: string | null;
  destaque: boolean;
  precoBase: number;
  sku: string;
  categories: Array<{ idCategoria?: number; nome: string }>;
  variants: ProductVariant[];
}

interface ProductVariantResponse {
  codigoSku?: string;
  precoVariante?: number | string;
  ativo?: boolean;
  cor?: string | null;
  tamanho?: string | null;
}

interface ProductResponse {
  idProduto?: number;
  titulo?: string;
  descricao?: string | null;
  destaque?: boolean;
  precoBase?: number | string;
  sku?: string;
  categories?: Array<{ idCategoria?: number; nome: string }>;
  variants?: ProductVariantResponse[];
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  categoryId?: number;
  destaque?: boolean;
  precoMin?: number;
  precoMax?: number;
}

const EMPTY_STOCK: StockResponse = { qtdOnline: 0, qtdLojaFisica: 0 };

async function hydrateVariant(raw: ProductVariantResponse): Promise<ProductVariant | null> {
  if (!raw.codigoSku) return null;

  const codigoSku = raw.codigoSku;
  const [stockResult, imagesResult] = await Promise.allSettled([
    api.get<StockResponse>(`/inventory/${encodeURIComponent(codigoSku)}`),
    api.get<CatalogImageLinkResponse[]>(`/images/catalog/${encodeURIComponent(codigoSku)}`),
  ]);

  return {
    codigoSku,
    precoVariante: Number(raw.precoVariante ?? 0),
    ativo: raw.ativo ?? true,
    cor: raw.cor ?? null,
    tamanho: raw.tamanho ?? null,
    stock: stockResult.status === "fulfilled" ? stockResult.value : EMPTY_STOCK,
    images:
      imagesResult.status === "fulfilled"
        ? [...imagesResult.value]
            .sort((a, b) => a.ordemNoCatalogo - b.ordemNoCatalogo)
            .map((link) => link.image)
        : [],
  };
}

export async function normalizeProduct(raw: ProductResponse): Promise<Product> {
  const variants = await Promise.all((raw.variants ?? []).map(hydrateVariant));

  return {
    idProduto: Number(raw.idProduto ?? 0),
    titulo: raw.titulo ?? "",
    descricao: raw.descricao ?? null,
    destaque: raw.destaque ?? false,
    precoBase: Number(raw.precoBase ?? 0),
    sku: raw.sku ?? "",
    categories: raw.categories ?? [],
    variants: variants.filter((variant): variant is ProductVariant => variant !== null),
  };
}

export async function fetchProducts(
  query: ProductQuery = {},
): Promise<PaginatedResponse<Product>> {
  const response = await api.get<PaginatedResponse<ProductResponse>>(
    "/products",
    query as Record<string, string | number | undefined>,
  );
  const data = await Promise.all((response.data ?? []).map(normalizeProduct));

  return { data, meta: response.meta };
}
export async function fetchProduct(idProduto: number): Promise<Product> {
  const response = await api.get<ProductResponse>(`/products/${idProduto}`);
  return normalizeProduct(response);
}
