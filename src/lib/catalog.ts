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
  material?: string | null;
  composicao?: string | null;
  silhueta?: string | null;
  qualMedida?: string | null;
  tags?: string[] | null;
  tipo?: string | null;
  /** Nota média das avaliações (0 quando o produto não tem avaliações). */
  mediaAvaliacao?: number;
  totalAvaliacoes?: number;
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
  material?: string | null;
  composicao?: string | null;
  silhueta?: string | null;
  qualMedida?: string | null;
  tags?: string[] | null;
  tipo?: string | null;
  // A média vem do Postgres como numeric, ou seja, como string ("4.50").
  mediaAvaliacao?: number | string | null;
  totalAvaliacoes?: number | string | null;
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

export function getDisplayVariant(product: Product): ProductVariant | undefined {
  const activeVariants = product.variants.filter((variant) => variant.ativo);
  const candidates = activeVariants.length > 0 ? activeVariants : product.variants;

  return [...candidates].sort((left, right) => {
    const score = (variant: ProductVariant) =>
      (variant.images.length > 0 ? 4 : 0) +
      (variant.stock.qtdOnline > 0 ? 2 : 0) +
      (variant.stock.qtdLojaFisica > 0 ? 1 : 0);
    return score(right) - score(left) || left.codigoSku.localeCompare(right.codigoSku);
  })[0];
}

export function findVariant(
  product: Product,
  color?: string,
  size?: string,
): ProductVariant | undefined {
  return product.variants.find(
    (variant) =>
      variant.ativo &&
      (!color || variant.cor === color) &&
      (!size || variant.tamanho === size),
  );
}

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

export function resolveProductTipo(raw: ProductResponse): string | null {
  if (raw.tipo && raw.tipo.trim()) {
    return raw.tipo.trim().toLowerCase();
  }

  const tags = (raw.tags ?? []).map((t) => t.trim().toLowerCase());
  if (tags.includes("midi")) return "midi";
  if (tags.includes("longo")) return "longo";
  if (tags.includes("longuete")) return "longuete";

  const medida = raw.qualMedida?.trim().toLowerCase();
  if (medida) {
    if (medida === "midi" || medida === "médio" || medida === "medio") return "midi";
    if (medida === "longo" || medida === "maxi") return "longo";
    if (medida === "longuete") return "longuete";
  }

  const fullText = `${raw.titulo ?? ""} ${raw.descricao ?? ""}`.toLowerCase();
  if (/\bmidi\b/.test(fullText)) return "midi";
  if (/\blonguete\b/.test(fullText)) return "longuete";
  if (/\blongo\b/.test(fullText)) return "longo";

  return null;
}

export async function normalizeProduct(raw: ProductResponse): Promise<Product> {
  const idProduto = Number(raw.idProduto);
  if (!Number.isInteger(idProduto) || idProduto <= 0) {
    throw new Error("Produto recebido sem idProduto válido");
  }
  const variants = await Promise.all((raw.variants ?? []).map(hydrateVariant));
  const tipo = resolveProductTipo(raw);

  return {
    idProduto,
    titulo: raw.titulo ?? "",
    descricao: raw.descricao ?? null,
    destaque: raw.destaque ?? false,
    precoBase: Number(raw.precoBase ?? 0),
    sku: raw.sku ?? "",
    material: raw.material ?? null,
    composicao: raw.composicao ?? null,
    silhueta: raw.silhueta ?? null,
    qualMedida: raw.qualMedida ?? null,
    tags: raw.tags ?? [],
    tipo,
    mediaAvaliacao: Number(raw.mediaAvaliacao) || 0,
    totalAvaliacoes: Number(raw.totalAvaliacoes) || 0,
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

export interface ProductReview {
  idProduto: number;
  nota: number;
  comentario: string | null;
  dataAvaliacao: string;
  /** Preenchida quando o cliente edita a avaliação; nula enquanto não editada. */
  dataEdicao?: string | null;
  cliente: { nome: string };
  compraVerificada?: boolean;
}

export interface ProductReviewsResponse {
  data: ProductReview[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  media: number;
  totalAvaliacoes: number;
  distribuicao: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
}

/** Busca uma página de avaliações. Rejeita quando a API falha. */
export async function getProductReviews(
  productId: number,
  page = 1,
  limit = 10,
): Promise<ProductReviewsResponse> {
  return api.get<ProductReviewsResponse>(`/reviews/product/${productId}`, { page, limit });
}

/** Como `getProductReviews`, mas uma falha da API vira uma lista vazia. */
export async function fetchProductReviews(
  productId: number,
  page = 1,
  limit = 10,
): Promise<ProductReviewsResponse> {
  try {
    return await getProductReviews(productId, page, limit);
  } catch {
    return {
      data: [],
      meta: { page, limit, total: 0, totalPages: 0 },
      media: 0,
      totalAvaliacoes: 0,
      distribuicao: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    };
  }
}


/** Por que o cliente pode ou não avaliar o produto (GET /reviews/product/:id/mine). */
export type ReviewEligibility = "PODE_AVALIAR" | "JA_AVALIOU" | "SEM_COMPRA_VERIFICADA";

export interface MyReview {
  idProduto: number;
  nota: number;
  comentario: string | null;
  dataAvaliacao: string;
  /** Nula enquanto o cliente não editou a avaliação. */
  dataEdicao: string | null;
}

export interface MyReviewStatus {
  avaliacao: MyReview | null;
  podeAvaliar: boolean;
  motivo: ReviewEligibility;
}

export interface ReviewInput {
  nota: number;
  comentario?: string;
}

/** Avaliação do cliente autenticado no produto e se ele pode avaliá-lo. */
export async function fetchMyReviewStatus(productId: number): Promise<MyReviewStatus> {
  return api.get<MyReviewStatus>(`/reviews/product/${productId}/mine`);
}

export async function createReview(productId: number, input: ReviewInput): Promise<void> {
  await api.post("/reviews", { idProduto: productId, ...input });
}

/** Edita nota e/ou comentário da própria avaliação. */
export async function updateReview(productId: number, input: Partial<ReviewInput>): Promise<void> {
  await api.patch(`/reviews/product/${productId}`, input);
}

/** Remove a própria avaliação do produto. */
export async function deleteMyReview(productId: number): Promise<void> {
  await api.delete(`/reviews/product/${productId}`);
}
