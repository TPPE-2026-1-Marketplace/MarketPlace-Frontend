import { describe, expect, it } from "vitest";
import { makeProduct, makeVariant } from "@/test/factories";
import { sumInventory, toInventoryRows } from "./useInventoryRows";

describe("useInventoryRows (cálculos)", () => {
  const products = [
    makeProduct({
      idProduto: 1,
      titulo: "Vestido Rosa",
      sku: "DK-ROSA",
      precoBase: 189.9,
      variants: [
        makeVariant({ codigoSku: "ROSA-P", cor: "Rosa", tamanho: "P", precoVariante: 200, stock: { qtdOnline: 4, qtdLojaFisica: 2 } }),
        makeVariant({ codigoSku: "ROSA-U", cor: null, tamanho: null, precoVariante: 0, stock: { qtdOnline: 1, qtdLojaFisica: 0 } }),
      ],
    }),
    makeProduct({ idProduto: 2, titulo: "Rascunho", sku: "DK-RASC", precoBase: 50, variants: [] }),
  ];

  it("gera uma linha por variante e uma para produto sem variantes", () => {
    const rows = toInventoryRows(products);

    expect(rows.map((row) => [row.codigoSku, row.variantLabel, row.price, row.total, row.isOrphan])).toEqual([
      ["ROSA-P", "Rosa / P", 200, 6, false],
      ["ROSA-U", "", 189.9, 1, false],
      ["DK-RASC", "Sem variantes cadastradas", 50, 0, true],
    ]);
  });

  it("soma os canais e conta o estoque baixo sem o produto sem variantes", () => {
    expect(sumInventory(toInventoryRows(products))).toEqual({ online: 5, physical: 2, total: 7, lowStock: 1 });
  });
});
