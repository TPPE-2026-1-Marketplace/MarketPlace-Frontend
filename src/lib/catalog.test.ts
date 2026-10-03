import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import {
  fetchProduct,
  fetchProducts,
  findVariant,
  getDisplayVariant,
  normalizeProduct,
  type Product,
  type ProductVariant,
} from "./catalog";

vi.mock("./api", () => ({ api: { get: vi.fn() } }));
const getMock = vi.mocked(api.get);

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    codigoSku: "SKU",
    precoVariante: 100,
    ativo: true,
    cor: null,
    tamanho: null,
    images: [],
    stock: { qtdOnline: 0, qtdLojaFisica: 0 },
    ...overrides,
  };
}

function product(variants: ProductVariant[]): Product {
  return {
    idProduto: 1,
    titulo: "Vestido",
    descricao: null,
    destaque: false,
    precoBase: 100,
    sku: "VEST",
    categories: [],
    variants,
  };
}

describe("getDisplayVariant", () => {
  it("prioriza variante ativa com imagem e estoque online", () => {
    const semNada = variant({ codigoSku: "A" });
    const comLoja = variant({ codigoSku: "B", stock: { qtdOnline: 0, qtdLojaFisica: 3 } });
    const comImagem = variant({
      codigoSku: "C",
      images: [{ idImagem: 1, url: "x.jpg", ordem: 1, descricao: null }],
    });
    const inativaCompleta = variant({
      codigoSku: "D",
      ativo: false,
      images: comImagem.images,
      stock: { qtdOnline: 9, qtdLojaFisica: 9 },
    });

    expect(getDisplayVariant(product([semNada, comLoja, comImagem, inativaCompleta]))?.codigoSku).toBe("C");
  });

  it("desempata pelo SKU e usa inativas quando não há ativas", () => {
    const b = variant({ codigoSku: "B", ativo: false });
    const a = variant({ codigoSku: "A", ativo: false });

    expect(getDisplayVariant(product([b, a]))?.codigoSku).toBe("A");
    expect(getDisplayVariant(product([]))).toBeUndefined();
  });
});

describe("findVariant", () => {
  const p = product([
    variant({ codigoSku: "P-AZUL", cor: "Azul", tamanho: "P" }),
    variant({ codigoSku: "M-AZUL", cor: "Azul", tamanho: "M" }),
    variant({ codigoSku: "M-ROSA", cor: "Rosa", tamanho: "M", ativo: false }),
  ]);

  it("filtra por cor e tamanho entre as variantes ativas", () => {
    expect(findVariant(p, "Azul", "M")?.codigoSku).toBe("M-AZUL");
    expect(findVariant(p, undefined, "P")?.codigoSku).toBe("P-AZUL");
    expect(findVariant(p)?.codigoSku).toBe("P-AZUL");
    expect(findVariant(p, "Rosa", "M")).toBeUndefined();
  });
});

describe("normalizeProduct", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("hidrata estoque e imagens ordenadas de cada variante", async () => {
    getMock.mockImplementation(async (path: string) => {
      if (path === "/inventory/SKU%201") return { qtdOnline: 2, qtdLojaFisica: 1 };
      if (path === "/images/catalog/SKU%201") {
        return [
          { idImagem: 2, codigoSku: "SKU 1", ordemNoCatalogo: 2, image: { idImagem: 2, url: "2.jpg", ordem: 2, descricao: null } },
          { idImagem: 1, codigoSku: "SKU 1", ordemNoCatalogo: 1, image: { idImagem: 1, url: "1.jpg", ordem: 1, descricao: null } },
        ];
      }
      throw new Error(`rota inesperada ${path}`);
    });

    const result = await normalizeProduct({
      idProduto: 7,
      titulo: "Saia",
      precoBase: "59.9",
      variants: [{ codigoSku: "SKU 1", precoVariante: "79.9", cor: "Preto" }, { precoVariante: 1 }],
    });

    expect(result).toEqual({
      idProduto: 7,
      titulo: "Saia",
      descricao: null,
      destaque: false,
      precoBase: 59.9,
      sku: "",
      categories: [],
      variants: [
        {
          codigoSku: "SKU 1",
          precoVariante: 79.9,
          ativo: true,
          cor: "Preto",
          tamanho: null,
          stock: { qtdOnline: 2, qtdLojaFisica: 1 },
          images: [
            { idImagem: 1, url: "1.jpg", ordem: 1, descricao: null },
            { idImagem: 2, url: "2.jpg", ordem: 2, descricao: null },
          ],
        },
      ],
    });
  });

  it("usa estoque zerado e sem imagens quando as rotas falham", async () => {
    getMock.mockRejectedValue(new Error("offline"));

    const result = await normalizeProduct({ idProduto: 1, variants: [{ codigoSku: "X", ativo: false }] });

    expect(result.variants[0]).toMatchObject({
      ativo: false,
      precoVariante: 0,
      stock: { qtdOnline: 0, qtdLojaFisica: 0 },
      images: [],
    });
  });

  it("rejeita produto sem idProduto válido", async () => {
    await expect(normalizeProduct({ titulo: "Sem id" })).rejects.toThrow("idProduto válido");
    await expect(normalizeProduct({ idProduto: -1 })).rejects.toThrow();
  });
});

describe("fetchProducts / fetchProduct", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("normaliza a página de produtos e mantém o meta", async () => {
    const meta = { page: 1, limit: 20, total: 1, totalPages: 1 };
    getMock.mockResolvedValueOnce({ data: [{ idProduto: 3, titulo: "Blusa" }], meta });

    const result = await fetchProducts({ page: 1, destaque: true });

    expect(getMock).toHaveBeenCalledWith("/products", { page: 1, destaque: true });
    expect(result.meta).toBe(meta);
    expect(result.data[0]).toMatchObject({ idProduto: 3, titulo: "Blusa", variants: [] });
  });

  it("aceita resposta sem data", async () => {
    getMock.mockResolvedValueOnce({ meta: undefined });
    await expect(fetchProducts()).resolves.toEqual({ data: [], meta: undefined });
  });

  it("busca um produto pelo id", async () => {
    getMock.mockResolvedValueOnce({ idProduto: 9, titulo: "Calça" });

    const result = await fetchProduct(9);

    expect(getMock).toHaveBeenCalledWith("/products/9");
    expect(result.titulo).toBe("Calça");
  });
});
