/** Product types matching the backend entity structure */

export interface Product {
  id_produto: number;
  titulo: string;
  descricao: string | null;
  destaque: boolean;
  qual_medida: string | null;
  material: string | null;
  composicao: string | null;
  silhueta: string | null;
  tags: string[] | null;
  preco_base: number;
  sku: string;
  categories: Category[];
  variants: ProductVariant[];
}

export interface ProductVariant {
  codigo_sku: string;
  id_produto: number;
  preco_variante: number;
  ativo: boolean;
  cor: string | null;
  tamanho: string | null;
  medidas: Measurements | null;
  images: CatalogImage[];
  stock?: Stock;
}

export interface Measurements {
  busto?: number;
  cintura?: number;
  quadril?: number;
  comprimento?: number;
  [key: string]: number | undefined;
}

export interface Category {
  id_categoria: number;
  nome: string;
}

export interface ProductImage {
  id_imagem: number;
  url: string;
  ordem: number;
  descricao: string | null;
  local_renderizacao: string | null;
}

export interface CatalogImage {
  id_imagem: number;
  codigo_sku: string;
  ordem_no_catalogo: number;
  image: ProductImage;
}

export interface Stock {
  codigo_sku: string;
  qtd_online: number;
  qtd_loja_fisica: number;
}

export interface ProductFilters {
  categoria?: string;
  busca?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}
