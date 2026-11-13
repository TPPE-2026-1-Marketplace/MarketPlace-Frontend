import type { Product } from "@/lib/catalog";

/** Imagem de uma cor no assistente: já salva (só exibição) ou nova (a enviar). */
export interface DraftImage {
  id: string;
  /** URL pública (imagem salva ou link) ou data URL (arquivo enviado/recortado). */
  src: string;
  /** Imagens salvas não podem ser removidas nem reordenadas pela API. */
  saved: boolean;
}

export interface DraftColor {
  name: string;
  /** Só para a amostra no painel: o backend guarda apenas o nome da cor. */
  hex: string;
  /** A primeira imagem é a capa da cor. */
  images: DraftImage[];
}

export interface DraftVariant {
  sku: string;
  color: string;
  size: string;
  online: number;
  physical: number;
  price: number;
  /** Variante que já existe no backend (edição). */
  saved: boolean;
}

export interface ProductDraft {
  title: string;
  description: string;
  sku: string;
  featured: boolean;
  categoryIds: number[];
  material: string;
  composition: string;
  silhouette: string;
  length: string;
  tags: string[];
  basePrice: number;
  sizes: string[];
  colors: DraftColor[];
  variants: DraftVariant[];
}

export const STANDARD_SIZES = ["PP", "P", "M", "G", "GG", "XGG", "34", "36", "38", "40", "42", "44", "46", "48", "U"];

export const SUGGESTED_COLORS: Array<{ name: string; hex: string }> = [
  { name: "Rosa Bebê", hex: "#f9a8d4" },
  { name: "Preto", hex: "#111827" },
  { name: "Branco", hex: "#f9fafb" },
  { name: "Vermelho", hex: "#dc2626" },
  { name: "Azul Royal", hex: "#1d4ed8" },
  { name: "Verde Esmeralda", hex: "#047857" },
  { name: "Nude", hex: "#d4b896" },
  { name: "Dourado", hex: "#ca8a04" },
];

/** Rascunho do cadastro guardado no navegador ("Salvar rascunho"). */
export const PRODUCT_DRAFT_STORAGE_KEY = "dk_product_draft";

export const PRODUCT_STEPS = ["Informação básica", "Categoria e atributos", "Venda e imagens", "Gestão de estoque"];

/** Cor neutra para amostras sem código (cores salvas, que não têm hex no backend). */
export const NEUTRAL_SWATCH = "#d1d5db";

export const EMPTY_DRAFT: ProductDraft = {
  title: "",
  description: "",
  sku: "",
  featured: false,
  categoryIds: [],
  material: "",
  composition: "",
  silhouette: "",
  length: "",
  tags: [],
  basePrice: 0,
  sizes: [],
  colors: [],
  variants: [],
};

const normalizeSkuPart = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();

/** "DK009-ROSABEBE-M", o mesmo padrão do cadastro anterior. */
export function createVariantSku(baseSku: string, color: string, size: string): string {
  return [baseSku, color, size].map(normalizeSkuPart).filter(Boolean).join("-");
}

let localIdCounter = 0;
export function localImageId(): string {
  localIdCounter += 1;
  return `local-${Date.now()}-${localIdCounter}`;
}

/**
 * Variantes de cada cor × tamanho. Mantém estoque e preço já digitados (ou salvos)
 * e, sem cor nem tamanho, gera uma variante única com o SKU base.
 */
export function buildVariants(draft: ProductDraft): DraftVariant[] {
  const previous = new Map(draft.variants.map((variant) => [`${variant.color}|${variant.size}`, variant]));
  const colors = draft.colors.length > 0 ? draft.colors.map((color) => color.name) : [""];
  const sizes = draft.sizes.length > 0 ? draft.sizes : [""];
  return colors.flatMap((color) =>
    sizes.map((size) => {
      const existing = previous.get(`${color}|${size}`);
      if (existing) return existing;
      return {
        sku: color || size ? createVariantSku(draft.sku, color, size) : draft.sku.trim().toUpperCase(),
        color: color || "Único",
        size: size || "U",
        online: 0,
        physical: 0,
        price: draft.basePrice,
        saved: false,
      };
    }),
  );
}

/** Mensagem do primeiro problema da etapa (0 a 3), ou null. */
export function validateStep(step: number, draft: ProductDraft): string | null {
  if (step === 0) {
    if (!draft.title.trim()) return "Informe o título do produto.";
    if (!draft.description.trim()) return "Informe a descrição do produto.";
    if (!draft.sku.trim()) return "Informe o SKU base.";
  }
  if (step === 1 && draft.categoryIds.length === 0) return "Selecione ao menos uma categoria.";
  if (step === 2) {
    if (!(draft.basePrice > 0)) return "Informe um preço base maior que zero.";
    if (draft.sizes.length === 0) return "Selecione ao menos um tamanho.";
    if (draft.colors.length === 0) return "Adicione ao menos uma cor.";
  }
  if (step === 3) {
    const invalid = draft.variants.find(
      (variant) => variant.online < 0 || variant.physical < 0 || !(variant.price > 0),
    );
    if (invalid) return `Revise estoque e preço de ${variantLabel(invalid)}.`;
  }
  return null;
}

export function variantLabel(variant: Pick<DraftVariant, "color" | "size">): string {
  return `${variant.color} / ${variant.size}`;
}

/** Rascunho a partir de um produto salvo (edição). */
export function draftFromProduct(product: Product): ProductDraft {
  const colors = new Map<string, DraftColor>();
  product.variants.forEach((variant) => {
    const name = variant.cor || "Único";
    const color = colors.get(name) ?? { name, hex: NEUTRAL_SWATCH, images: [] };
    variant.images.forEach((image) => {
      if (!color.images.some((item) => item.src === image.url)) {
        color.images.push({ id: `saved-${image.idImagem}`, src: image.url, saved: true });
      }
    });
    colors.set(name, color);
  });
  return {
    title: product.titulo,
    description: product.descricao ?? "",
    sku: product.sku,
    featured: product.destaque,
    categoryIds: product.categories.flatMap((category) => (category.idCategoria ? [category.idCategoria] : [])),
    material: product.material ?? "",
    composition: product.composicao ?? "",
    silhouette: product.silhueta ?? "",
    length: product.qualMedida ?? "",
    tags: product.tags ?? [],
    basePrice: product.precoBase,
    sizes: [...new Set(product.variants.map((variant) => variant.tamanho || "U"))],
    colors: [...colors.values()],
    variants: product.variants.map((variant) => ({
      sku: variant.codigoSku,
      color: variant.cor || "Único",
      size: variant.tamanho || "U",
      online: variant.stock.qtdOnline,
      physical: variant.stock.qtdLojaFisica,
      price: variant.precoVariante || product.precoBase,
      saved: true,
    })),
  };
}

export interface DraftChange {
  label: string;
  before: string;
  after: string;
}

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const units = (value: number) => `${value} ${value === 1 ? "unidade" : "unidades"}`;

/** Campos alterados entre o produto salvo e o rascunho, para "Revisar alterações". */
export function diffDrafts(
  original: ProductDraft,
  draft: ProductDraft,
  categoryName: (id: number) => string,
): DraftChange[] {
  const changes: DraftChange[] = [];
  const text = (label: string, before: string, after: string) => {
    if (before.trim() !== after.trim()) changes.push({ label, before: before || "—", after: after || "—" });
  };
  text("Título", original.title, draft.title);
  text("Descrição", original.description, draft.description);
  text("Produto em destaque", original.featured ? "Sim" : "Não", draft.featured ? "Sim" : "Não");
  text(
    "Categorias",
    original.categoryIds.map(categoryName).join(", "),
    draft.categoryIds.map(categoryName).join(", "),
  );
  text("Material", original.material, draft.material);
  text("Composição", original.composition, draft.composition);
  text("Silhueta", original.silhouette, draft.silhouette);
  text("Qual medida", original.length, draft.length);
  text("Tags", original.tags.join(", "), draft.tags.join(", "));
  if (original.basePrice !== draft.basePrice) {
    changes.push({ label: "Preço base", before: brl(original.basePrice), after: brl(draft.basePrice) });
  }
  text("Tamanhos", original.sizes.join(", "), draft.sizes.join(", "));
  text(
    "Cores",
    original.colors.map((color) => color.name).join(", "),
    draft.colors.map((color) => color.name).join(", "),
  );
  draft.colors.forEach((color) => {
    const added = color.images.filter((image) => !image.saved).length;
    if (added > 0) {
      const before = original.colors.find((item) => item.name === color.name)?.images.length ?? 0;
      changes.push({
        label: `Fotos · ${color.name}`,
        before: `${before} ${before === 1 ? "foto" : "fotos"}`,
        after: `${before + added} ${before + added === 1 ? "foto" : "fotos"}`,
      });
    }
  });
  const savedVariants = new Map(original.variants.map((variant) => [variant.sku, variant]));
  draft.variants.forEach((variant) => {
    const saved = savedVariants.get(variant.sku);
    if (!saved) return;
    const name = variantLabel(variant);
    if (saved.online !== variant.online) {
      changes.push({ label: `Estoque online · ${name}`, before: units(saved.online), after: units(variant.online) });
    }
    if (saved.physical !== variant.physical) {
      changes.push({ label: `Loja física · ${name}`, before: units(saved.physical), after: units(variant.physical) });
    }
    if (saved.price !== variant.price) {
      changes.push({ label: `Preço · ${name}`, before: brl(saved.price), after: brl(variant.price) });
    }
  });
  const newVariants = draft.variants.filter((variant) => !savedVariants.has(variant.sku));
  if (newVariants.length > 0) {
    changes.push({ label: "Novas variantes", before: "—", after: newVariants.map(variantLabel).join(", ") });
  }
  const removed = original.variants.filter((variant) => !draft.variants.some((item) => item.sku === variant.sku));
  if (removed.length > 0) {
    changes.push({ label: "Variantes desativadas", before: removed.map(variantLabel).join(", "), after: "—" });
  }
  return changes;
}
