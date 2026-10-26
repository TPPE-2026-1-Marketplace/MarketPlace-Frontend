import { useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import type { Product } from "@/lib/catalog";
import { useProducts } from "@/hooks/useProducts";

/** Até 5 unidades somando os dois canais, a mesma regra de alerta do painel. */
export const LOW_STOCK_LIMIT = 5;

export interface InventoryRow {
  product: Product;
  codigoSku: string;
  title: string;
  baseSku: string;
  /** "Rosa / M"; vazio quando a variante não tem cor nem tamanho. */
  variantLabel: string;
  price: number;
  stockOnline: number;
  stockPhysical: number;
  total: number;
  /** Produto sem variantes: a linha usa o SKU base e não tem estoque. */
  isOrphan: boolean;
}

export interface InventoryTotals {
  online: number;
  physical: number;
  total: number;
  lowStock: number;
}

export function toInventoryRows(products: Product[]): InventoryRow[] {
  return products.flatMap((product): InventoryRow[] => {
    if (product.variants.length === 0) {
      return [
        {
          product,
          codigoSku: product.sku,
          title: product.titulo,
          baseSku: product.sku,
          variantLabel: "Sem variantes cadastradas",
          price: product.precoBase,
          stockOnline: 0,
          stockPhysical: 0,
          total: 0,
          isOrphan: true,
        },
      ];
    }
    return product.variants.map((variant) => {
      const stockOnline = variant.stock?.qtdOnline || 0;
      const stockPhysical = variant.stock?.qtdLojaFisica || 0;
      return {
        product,
        codigoSku: variant.codigoSku,
        title: product.titulo,
        baseSku: product.sku,
        variantLabel: [variant.cor, variant.tamanho].filter(Boolean).join(" / "),
        price: variant.precoVariante || product.precoBase,
        stockOnline,
        stockPhysical,
        total: stockOnline + stockPhysical,
        isOrphan: false,
      };
    });
  });
}

export function sumInventory(rows: InventoryRow[]): InventoryTotals {
  return rows.reduce(
    (sum, row) => ({
      online: sum.online + row.stockOnline,
      physical: sum.physical + row.stockPhysical,
      total: sum.total + row.total,
      lowStock: sum.lowStock + (!row.isOrphan && row.total <= LOW_STOCK_LIMIT ? 1 : 0),
    }),
    { online: 0, physical: 0, total: 0, lowStock: 0 },
  );
}

/** Estoque por variante do catálogo e o ajuste por canal (PATCH /inventory/:sku). */
export function useInventoryRows() {
  const { products, isLoading, error, refetch } = useProducts({ page: 1, limit: 100 });
  const rows = useMemo(() => toInventoryRows(products), [products]);
  const totals = useMemo(() => sumInventory(rows), [rows]);

  const adjustStock = useCallback(
    async (codigoSku: string, stock: { online: number; physical: number }) => {
      await api.patch(`/inventory/${encodeURIComponent(codigoSku)}`, {
        qtdOnline: stock.online,
        qtdLojaFisica: stock.physical,
        motivo: "Ajuste pelo inventário",
        tipoMovimentacao: "ajuste",
      });
      refetch();
    },
    [refetch],
  );

  /** Exclui a variante; a última variante (ou um produto sem variantes) leva o produto junto. */
  const removeRow = useCallback(
    async (row: InventoryRow) => {
      if (row.isOrphan || row.product.variants.length === 1) {
        await api.delete(`/products/${row.product.idProduto}`);
      } else {
        await api.delete(`/product-variants/${encodeURIComponent(row.codigoSku)}`);
      }
      refetch();
    },
    [refetch],
  );

  return { rows, totals, isLoading, error, refetch, adjustStock, removeRow };
}
