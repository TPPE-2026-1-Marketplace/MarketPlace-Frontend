/** Cart types — frontend-only (localStorage persistence) */

import type { ProductVariant, Product } from "./product.model";

export interface CartItem {
  product: Pick<Product, "id_produto" | "titulo" | "preco_base">;
  variant: Pick<ProductVariant, "codigo_sku" | "preco_variante" | "cor" | "tamanho">;
  imageUrl: string | null;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  frete: number;
  desconto: number;
  cupom: string | null;
  total: number;
}
