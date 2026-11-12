import { describe, expect, it } from "vitest";
import { makeProduct, makeVariant } from "@/test/factories";
import {
  EMPTY_DRAFT,
  buildVariants,
  createVariantSku,
  diffDrafts,
  draftFromProduct,
  validateStep,
  type ProductDraft,
} from "./productDraft";

const draft = (patch: Partial<ProductDraft> = {}): ProductDraft => ({
  ...EMPTY_DRAFT,
  title: "Princesa Rosé",
  description: "Tule com brilho",
  sku: "DK-009",
  categoryIds: [1],
  basePrice: 599.9,
  sizes: ["M", "G"],
  colors: [
    { name: "Rosa Bebê", hex: "#f9a8d4", images: [] },
    { name: "Preto", hex: "#111827", images: [] },
  ],
  ...patch,
});

describe("productDraft", () => {
  it("gera o SKU da variante no padrão DK009-ROSABEBE-M", () => {
    expect(createVariantSku("DK-009", "Rosa Bebê", "M")).toBe("DK009-ROSABEBE-M");
    expect(createVariantSku("dk 9", "", "U")).toBe("DK9-U");
  });

  it("gera uma variante por cor e tamanho mantendo valores já digitados", () => {
    const first = buildVariants(draft());
    expect(first.map((variant) => variant.sku)).toEqual([
      "DK009-ROSABEBE-M",
      "DK009-ROSABEBE-G",
      "DK009-PRETO-M",
      "DK009-PRETO-G",
    ]);
    expect(first[0]).toMatchObject({ online: 0, physical: 0, price: 599.9, saved: false });

    const edited = first.map((variant, index) => (index === 0 ? { ...variant, online: 4 } : variant));
    const again = buildVariants(draft({ variants: edited, sizes: ["M"] }));
    expect(again).toHaveLength(2);
    expect(again[0].online).toBe(4);

    expect(buildVariants(draft({ colors: [], sizes: [] }))).toEqual([
      expect.objectContaining({ sku: "DK-009", color: "Único", size: "U" }),
    ]);
  });

  it("valida cada etapa", () => {
    expect(validateStep(0, draft({ title: " " }))).toBe("Informe o título do produto.");
    expect(validateStep(0, draft({ description: "" }))).toBe("Informe a descrição do produto.");
    expect(validateStep(0, draft({ sku: "" }))).toBe("Informe o SKU base.");
    expect(validateStep(1, draft({ categoryIds: [] }))).toBe("Selecione ao menos uma categoria.");
    expect(validateStep(2, draft({ basePrice: 0 }))).toBe("Informe um preço base maior que zero.");
    expect(validateStep(2, draft({ sizes: [] }))).toBe("Selecione ao menos um tamanho.");
    expect(validateStep(2, draft({ colors: [] }))).toBe("Adicione ao menos uma cor.");
    const variants = buildVariants(draft()).map((variant, index) => (index === 1 ? { ...variant, price: 0 } : variant));
    expect(validateStep(3, draft({ variants }))).toBe("Revise estoque e preço de Rosa Bebê / G.");
    expect(validateStep(0, draft())).toBeNull();
  });

  it("monta o rascunho de um produto salvo e compara as alterações", () => {
    const product = makeProduct({
      idProduto: 9,
      titulo: "Princesa Rosé",
      sku: "DK-009",
      precoBase: 599.9,
      descricao: "Tule",
      categories: [{ idCategoria: 1, nome: "Festa" }],
      variants: [
        makeVariant({
          codigoSku: "DK009-ROSA-M",
          cor: "Rosa",
          tamanho: "M",
          precoVariante: 599.9,
          stock: { qtdOnline: 4, qtdLojaFisica: 2 },
          images: [{ idImagem: 7, url: "https://img/rosa.jpg", ordem: 1, descricao: null }],
        }),
        makeVariant({ codigoSku: "DK009-ROSA-G", cor: "Rosa", tamanho: "G", precoVariante: 0, images: [], stock: { qtdOnline: 1, qtdLojaFisica: 0 } }),
      ],
    });
    const original = draftFromProduct(product);
    expect(original.colors).toEqual([
      expect.objectContaining({ name: "Rosa", images: [{ id: "saved-7", src: "https://img/rosa.jpg", saved: true }] }),
    ]);
    expect(original.sizes).toEqual(["M", "G"]);
    expect(original.variants[1]).toMatchObject({ price: 599.9, saved: true });

    const changed: ProductDraft = {
      ...original,
      title: "Princesa Rosé Premium",
      basePrice: 649.9,
      categoryIds: [1, 2],
      colors: [{ ...original.colors[0], images: [...original.colors[0].images, { id: "n", src: "data:x", saved: false }] }],
      variants: [{ ...original.variants[0], online: 6, price: 649.9 }, { ...original.variants[0], sku: "DK009-ROSA-P", size: "P", saved: false }],
    };
    const changes = diffDrafts(original, changed, (id) => (id === 1 ? "Festa" : "Vestidos"));
    expect(changes.map((change) => change.label)).toEqual([
      "Título",
      "Categorias",
      "Preço base",
      "Fotos · Rosa",
      "Estoque online · Rosa / M",
      "Preço · Rosa / M",
      "Novas variantes",
      "Variantes desativadas",
    ]);
    expect(changes[0]).toEqual({ label: "Título", before: "Princesa Rosé", after: "Princesa Rosé Premium" });
    expect(changes[4]).toEqual({ label: "Estoque online · Rosa / M", before: "4 unidades", after: "6 unidades" });
    expect(changes[3]).toEqual({ label: "Fotos · Rosa", before: "1 foto", after: "2 fotos" });
    expect(diffDrafts(original, original, String)).toEqual([]);
  });
});
