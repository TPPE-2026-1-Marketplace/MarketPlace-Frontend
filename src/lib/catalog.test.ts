import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import {
  createReview,
  deleteMyReview,
  fetchMyReviewStatus,
  fetchProduct,
  fetchProducts,
  fetchProductReviews,
  findVariant,
  getDisplayVariant,
  normalizeProduct,
  updateReview,
  type Product,
  type ProductVariant,
} from "./catalog";

vi.mock("./api", () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
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
      material: null,
      composicao: null,
      silhueta: null,
      mediaAvaliacao: 0,
      totalAvaliacoes: 0,
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

  it("converte a média (numeric do Postgres vem como string) e o total de avaliações", async () => {
    const result = await normalizeProduct({ idProduto: 1, mediaAvaliacao: "4.50", totalAvaliacoes: "12" });

    expect(result.mediaAvaliacao).toBe(4.5);
    expect(result.totalAvaliacoes).toBe(12);
  });

  it("usa zero quando o produto não traz média nem total", async () => {
    const semCampos = await normalizeProduct({ idProduto: 1 });
    const nulos = await normalizeProduct({ idProduto: 1, mediaAvaliacao: null, totalAvaliacoes: null });

    expect(semCampos).toMatchObject({ mediaAvaliacao: 0, totalAvaliacoes: 0 });
    expect(nulos).toMatchObject({ mediaAvaliacao: 0, totalAvaliacoes: 0 });
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

describe("fetchProductReviews", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("retorna as avaliações e média da rota", async () => {
    const mockReviews = {
      data: [{ idProduto: 7, nota: 5, comentario: "Ótimo", dataAvaliacao: "2026-01-01", cliente: { nome: "Ana" } }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      media: 5,
      totalAvaliacoes: 1,
      distribuicao: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 1 },
    };
    getMock.mockResolvedValueOnce(mockReviews);

    const result = await fetchProductReviews(7);

    expect(getMock).toHaveBeenCalledWith("/reviews/product/7", { page: 1, limit: 10 });
    expect(result).toEqual(mockReviews);
  });

  it("retorna estrutura vazia segura em caso de erro da API", async () => {
    getMock.mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchProductReviews(7);

    expect(result).toEqual({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      media: 0,
      totalAvaliacoes: 0,
      distribuicao: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    });
  });

  it("preserva a página solicitada no meta em caso de erro", async () => {
    getMock.mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchProductReviews(7, 3, 5);

    expect(result.meta).toEqual({ page: 3, limit: 5, total: 0, totalPages: 0 });
  });
});

describe("avaliação do próprio cliente", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset().mockResolvedValue(undefined);
    vi.mocked(api.patch).mockReset().mockResolvedValue(undefined);
    vi.mocked(api.delete).mockReset().mockResolvedValue(undefined);
  });

  it("consulta o estado do cliente no produto", async () => {
    const status = { avaliacao: null, podeAvaliar: true, motivo: "PODE_AVALIAR" };
    getMock.mockResolvedValueOnce(status);

    await expect(fetchMyReviewStatus(7)).resolves.toEqual(status);
    expect(getMock).toHaveBeenCalledWith("/reviews/product/7/mine");
  });

  it("cria a avaliação enviando o produto no corpo", async () => {
    await createReview(7, { nota: 5, comentario: "Lindo" });

    expect(api.post).toHaveBeenCalledWith("/reviews", { idProduto: 7, nota: 5, comentario: "Lindo" });
  });

  it("edita a própria avaliação pelo produto da rota", async () => {
    await updateReview(7, { nota: 3 });

    expect(api.patch).toHaveBeenCalledWith("/reviews/product/7", { nota: 3 });
  });

  it("remove a própria avaliação", async () => {
    await deleteMyReview(7);

    expect(api.delete).toHaveBeenCalledWith("/reviews/product/7");
  });
});
