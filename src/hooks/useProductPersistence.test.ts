import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { EMPTY_DRAFT, type ProductDraft } from "@/lib/productDraft";
import { useCategories, useProductPersistence } from "./useProductPersistence";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
const postMock = vi.mocked(api.post);
const patchMock = vi.mocked(api.patch);
const deleteMock = vi.mocked(api.delete);

const variant = (sku: string, color: string, size: string, saved = false) => ({
  sku,
  color,
  size,
  online: 2,
  physical: 1,
  price: 300,
  saved,
});

const draft: ProductDraft = {
  ...EMPTY_DRAFT,
  title: " Vestido Novo ",
  description: "Tule",
  sku: "DK-NOVO",
  featured: true,
  categoryIds: [1, 4],
  material: "Tule",
  tags: ["festa"],
  basePrice: 300,
  sizes: ["M"],
  colors: [
    {
      name: "Preto",
      hex: "#111827",
      images: [
        { id: "a", src: "https://img/preto.jpg", saved: false },
        { id: "b", src: "data:image/png;base64,AAA", saved: false },
      ],
    },
    { name: "Branco", hex: "#ffffff", images: [] },
  ],
  variants: [variant("DKNOVO-PRETO-M", "Preto", "M"), variant("DKNOVO-BRANCO-M", "Branco", "M")],
};

describe("useProductPersistence", () => {
  beforeEach(() => {
    for (const fn of [postMock, patchMock, deleteMock]) fn.mockReset();
    patchMock.mockResolvedValue({});
    deleteMock.mockResolvedValue(undefined);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ blob: async () => new Blob(["x"], { type: "image/png" }) })),
    );
  });

  it("cria produto, categorias, variantes, estoque e liga as fotos de cada cor", async () => {
    postMock.mockImplementation(async (path: string) => {
      if (path === "/products") return { idProduto: 5 };
      if (path === "/images") return { idImagem: 11 };
      if (path === "/images/upload") return { idImagem: 12 };
      return {};
    });
    const onSaved = vi.fn();
    const { result } = renderHook(() => useProductPersistence(onSaved));

    await expect(result.current.createProduct(draft)).resolves.toEqual({ imageFailures: [] });

    expect(postMock).toHaveBeenCalledWith("/products", expect.objectContaining({ titulo: "Vestido Novo", sku: "DK-NOVO", preco_base: 300, destaque: true, material: "Tule", tags: ["festa"] }));
    expect(postMock).toHaveBeenCalledWith("/products/5/categories/1");
    expect(postMock).toHaveBeenCalledWith("/products/5/categories/4");
    expect(postMock).toHaveBeenCalledWith("/product-variants", { idProduto: 5, codigoSku: "DKNOVO-PRETO-M", precoVariante: 300, ativo: true, cor: "Preto", tamanho: "M" });
    expect(patchMock).toHaveBeenCalledWith("/inventory/DKNOVO-PRETO-M", expect.objectContaining({ qtdOnline: 2, qtdLojaFisica: 1, motivo: "Cadastro inicial" }));
    expect(postMock).toHaveBeenCalledWith("/images", { url: "https://img/preto.jpg", ordem: 1 });
    expect(postMock).toHaveBeenCalledWith("/images/upload", expect.any(FormData));
    expect(postMock).toHaveBeenCalledWith("/images/catalog", { imageId: 11, variantSku: "DKNOVO-PRETO-M", ordem_no_catalogo: 1 });
    expect(postMock).toHaveBeenCalledWith("/images/catalog", { imageId: 12, variantSku: "DKNOVO-PRETO-M", ordem_no_catalogo: 2 });
    expect(onSaved).toHaveBeenCalled();
  });

  it("devolve as fotos que falharam sem desfazer o produto", async () => {
    postMock.mockImplementation(async (path: string) => {
      if (path === "/products") return { idProduto: 5 };
      if (path.startsWith("/images")) throw new Error("ImgBB indisponível");
      return {};
    });
    const { result } = renderHook(() => useProductPersistence(vi.fn()));

    await expect(result.current.createProduct(draft)).resolves.toEqual({
      imageFailures: ["Preto (foto 1)", "Preto (foto 2)"],
    });
  });

  it("na edição só envia o que mudou e desativa as variantes removidas", async () => {
    postMock.mockImplementation(async (path: string) => (path === "/images" ? { idImagem: 20 } : {}));
    const original: ProductDraft = {
      ...draft,
      categoryIds: [1, 2],
      colors: [{ name: "Preto", hex: "#111827", images: [{ id: "s", src: "https://img/salva.jpg", saved: true }] }],
      variants: [variant("DKNOVO-PRETO-M", "Preto", "M", true), variant("DKNOVO-PRETO-G", "Preto", "G", true)],
    };
    const edited: ProductDraft = {
      ...original,
      title: "Vestido Editado",
      categoryIds: [1, 3],
      colors: [{ ...original.colors[0], images: [...original.colors[0].images, { id: "n", src: "https://img/nova.jpg", saved: false }] }],
      variants: [
        { ...original.variants[0], online: 9, price: 350 },
        variant("DKNOVO-PRETO-P", "Preto", "P"),
      ],
    };
    const { result } = renderHook(() => useProductPersistence(vi.fn()));

    await result.current.updateProduct(5, original, edited);

    expect(patchMock).toHaveBeenCalledWith("/products/5", expect.objectContaining({ titulo: "Vestido Editado" }));
    expect(patchMock.mock.calls[0][1]).not.toHaveProperty("sku");
    expect(postMock).toHaveBeenCalledWith("/products/5/categories/3");
    expect(deleteMock).toHaveBeenCalledWith("/products/5/categories/2");
    expect(patchMock).toHaveBeenCalledWith("/product-variants/DKNOVO-PRETO-M", { precoVariante: 350 });
    expect(patchMock).toHaveBeenCalledWith("/inventory/DKNOVO-PRETO-M", expect.objectContaining({ qtdOnline: 9, motivo: "Edição do produto" }));
    expect(postMock).toHaveBeenCalledWith("/product-variants", expect.objectContaining({ idProduto: 5, codigoSku: "DKNOVO-PRETO-P" }));
    expect(patchMock).toHaveBeenCalledWith("/product-variants/DKNOVO-PRETO-G", { ativo: false });
    // A foto nova entra depois da salva, nas duas variantes da cor.
    expect(postMock).toHaveBeenCalledWith("/images", { url: "https://img/nova.jpg", ordem: 2 });
    expect(postMock).toHaveBeenCalledWith("/images/catalog", { imageId: 20, variantSku: "DKNOVO-PRETO-P", ordem_no_catalogo: 2 });
    expect(postMock.mock.calls.filter(([path]) => path === "/images")).toHaveLength(1);
  });
});

describe("useCategories", () => {
  it("carrega as categorias e tolera falha", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [{ idCategoria: 1, nome: "Festa" }], meta: {} });
    const { result } = renderHook(() => useCategories());
    await waitFor(() => expect(result.current).toEqual([{ idCategoria: 1, nome: "Festa" }]));

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.get).mockRejectedValueOnce(new Error("500"));
    const failed = renderHook(() => useCategories());
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(failed.result.current).toEqual([]);
  });
});
