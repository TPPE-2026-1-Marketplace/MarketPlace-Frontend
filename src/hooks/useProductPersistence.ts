import { useCallback, useEffect, useState } from "react";
import { api, type PaginatedResponse } from "@/lib/api";
import type { DraftColor, DraftImage, ProductDraft } from "@/lib/productDraft";

export interface ApiCategory {
  idCategoria: number;
  nome: string;
}

/** Categorias do catálogo (lista simples no backend). */
export function useCategories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  useEffect(() => {
    api
      .get<PaginatedResponse<ApiCategory>>("/categories", { page: 1, limit: 100 })
      .then((response) => setCategories(response.data))
      .catch((error) => console.error("Erro ao carregar categorias", error));
  }, []);
  return categories;
}

/** Resultado de uma gravação: imagens que falharam não desfazem o produto. */
export interface SaveResult {
  imageFailures: string[];
}

function productBody(draft: ProductDraft) {
  return {
    titulo: draft.title.trim(),
    descricao: draft.description.trim() || undefined,
    destaque: draft.featured,
    qual_medida: draft.length.trim() || undefined,
    material: draft.material.trim() || undefined,
    composicao: draft.composition.trim() || undefined,
    silhueta: draft.silhouette.trim() || undefined,
    tags: draft.tags.length > 0 ? draft.tags : undefined,
    preco_base: draft.basePrice,
  };
}

/** Envia (arquivo/recorte) ou registra (link) uma imagem e devolve o id. */
async function registerImage(image: DraftImage, ordem: number): Promise<number> {
  if (image.src.startsWith("data:")) {
    const blob = await (await fetch(image.src)).blob();
    const formData = new FormData();
    formData.append("file", new File([blob], `foto-${ordem}.jpg`, { type: blob.type || "image/jpeg" }));
    formData.append("ordem", String(ordem));
    const uploaded = await api.post<{ idImagem: number }>("/images/upload", formData);
    return uploaded.idImagem;
  }
  const registered = await api.post<{ idImagem: number }>("/images", { url: image.src, ordem });
  return registered.idImagem;
}

/** Liga as fotos novas da cor a cada variante dela, continuando a ordem das já salvas. */
async function linkColorImages(color: DraftColor, variantSkus: string[], failures: string[]) {
  const savedCount = color.images.filter((image) => image.saved).length;
  const pending = color.images.filter((image) => !image.saved);
  for (let index = 0; index < pending.length; index += 1) {
    const ordem = savedCount + index + 1;
    try {
      const imageId = await registerImage(pending[index], ordem);
      for (const variantSku of variantSkus) {
        await api.post("/images/catalog", { imageId, variantSku, ordem_no_catalogo: ordem });
      }
    } catch (error) {
      console.warn(`Falha ao enviar a foto ${ordem} da cor ${color.name}`, error);
      failures.push(`${color.name} (foto ${ordem})`);
    }
  }
}

async function setStock(sku: string, online: number, physical: number, motivo: string) {
  await api.patch(`/inventory/${encodeURIComponent(sku)}`, {
    qtdOnline: online,
    qtdLojaFisica: physical,
    motivo,
    tipoMovimentacao: "ajuste",
  });
}

/**
 * Cadastro e edição do assistente de produto. As falhas de produto, variante e
 * estoque sobem para o dialog; as de imagem viram aviso no resultado.
 */
export function useProductPersistence(onSaved: () => void) {
  const createProduct = useCallback(
    async (draft: ProductDraft): Promise<SaveResult> => {
      const created = await api.post<{ idProduto: number }>("/products", {
        ...productBody(draft),
        sku: draft.sku.trim(),
      });
      for (const categoryId of draft.categoryIds) {
        await api.post(`/products/${created.idProduto}/categories/${categoryId}`);
      }
      for (const variant of draft.variants) {
        await api.post("/product-variants", {
          idProduto: created.idProduto,
          codigoSku: variant.sku,
          precoVariante: variant.price,
          ativo: true,
          cor: variant.color,
          tamanho: variant.size,
        });
        await setStock(variant.sku, variant.online, variant.physical, "Cadastro inicial");
      }
      const failures: string[] = [];
      for (const color of draft.colors) {
        const skus = draft.variants.filter((variant) => variant.color === color.name).map((variant) => variant.sku);
        await linkColorImages(color, skus, failures);
      }
      onSaved();
      return { imageFailures: failures };
    },
    [onSaved],
  );

  const updateProduct = useCallback(
    async (idProduto: number, original: ProductDraft, draft: ProductDraft): Promise<SaveResult> => {
      await api.patch(`/products/${idProduto}`, productBody(draft));

      const addedCategories = draft.categoryIds.filter((id) => !original.categoryIds.includes(id));
      const removedCategories = original.categoryIds.filter((id) => !draft.categoryIds.includes(id));
      for (const categoryId of addedCategories) await api.post(`/products/${idProduto}/categories/${categoryId}`);
      for (const categoryId of removedCategories) await api.delete(`/products/${idProduto}/categories/${categoryId}`);

      const savedVariants = new Map(original.variants.map((variant) => [variant.sku, variant]));
      for (const variant of draft.variants) {
        const saved = savedVariants.get(variant.sku);
        if (!saved) {
          await api.post("/product-variants", {
            idProduto,
            codigoSku: variant.sku,
            precoVariante: variant.price,
            ativo: true,
            cor: variant.color,
            tamanho: variant.size,
          });
          await setStock(variant.sku, variant.online, variant.physical, "Nova variante na edição");
          continue;
        }
        if (saved.price !== variant.price) {
          await api.patch(`/product-variants/${encodeURIComponent(variant.sku)}`, { precoVariante: variant.price });
        }
        if (saved.online !== variant.online || saved.physical !== variant.physical) {
          await setStock(variant.sku, variant.online, variant.physical, "Edição do produto");
        }
      }
      // Excluir variante é só do administrador; desativar vale para gerente e preserva o histórico.
      for (const removed of original.variants.filter((variant) => !draft.variants.some((item) => item.sku === variant.sku))) {
        await api.patch(`/product-variants/${encodeURIComponent(removed.sku)}`, { ativo: false });
      }

      const failures: string[] = [];
      for (const color of draft.colors) {
        const skus = draft.variants.filter((variant) => variant.color === color.name).map((variant) => variant.sku);
        await linkColorImages(color, skus, failures);
      }
      onSaved();
      return { imageFailures: failures };
    },
    [onSaved],
  );

  return { createProduct, updateProduct };
}
