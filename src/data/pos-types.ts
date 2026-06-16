import { Product } from "./products";

export interface ProductVariation {
  size: string;
  color: string;
  stockPhysical: number;
  stockOnline: number;
}

export interface POSSaleItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

export interface POSSale {
  id: string;
  items: POSSaleItem[];
  subtotal: number;
  total: number;
  paymentMethod: "pix" | "card";
  sellerId: string;
  sellerName: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  date: string;
  timestamp: number;
}

export function generateProductVariations(product: Product): ProductVariation[] {
  const variations: ProductVariation[] = [];

  const stockPerVariation = Math.floor(product.stockPhysical / (product.sizes.length * (product.colors.length || 1)));
  const onlineStockPerVariation = Math.floor(product.stockEcommerce / (product.sizes.length * (product.colors.length || 1)));

  for (const size of product.sizes) {
    if (product.colors && product.colors.length > 0) {
      for (const color of product.colors) {
        variations.push({
          size,
          color,
          stockPhysical: stockPerVariation,
          stockOnline: onlineStockPerVariation,
        });
      }
    } else {
      variations.push({
        size,
        color: "Padrão",
        stockPhysical: Math.floor(product.stockPhysical / product.sizes.length),
        stockOnline: Math.floor(product.stockEcommerce / product.sizes.length),
      });
    }
  }

  return variations;
}
