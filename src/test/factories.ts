import type { Product, ProductVariant } from "@/lib/catalog";

export function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    codigoSku: "DK-001-P-ROSA",
    precoVariante: 199.9,
    ativo: true,
    cor: "Rosa",
    tamanho: "P",
    images: [{ idImagem: 1, url: "/vestido.jpg", ordem: 1, descricao: null }],
    stock: { qtdOnline: 5, qtdLojaFisica: 2 },
    ...overrides,
  };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    idProduto: 1,
    titulo: "Vestido Rosa Encanto",
    descricao: "Vestido longo de festa",
    destaque: true,
    precoBase: 189.9,
    sku: "DK-001",
    categories: [{ idCategoria: 1, nome: "Debutante" }],
    variants: [makeVariant()],
    ...overrides,
  };
}
