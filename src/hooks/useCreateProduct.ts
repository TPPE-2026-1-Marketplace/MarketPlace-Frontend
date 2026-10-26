import { useCallback } from "react";
import { api } from "@/lib/api";

/** Dados entregues pelo assistente de cadastro (AddProduct). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NewProductPayload = { form: any; variants: any[] };

/**
 * Cadastro de produto vindo do AddProduct: produto, variantes, estoque inicial e
 * imagens. Devolve `true` quando o produto foi criado.
 */
export function useCreateProduct(onCreated: () => void) {
  return useCallback(
    async ({ form, variants }: NewProductPayload): Promise<boolean> => {
      try {
        const createdProduct = await api.post<{ idProduto: number }>("/products", {
          titulo: form.title,
          sku: form.sku,
          preco_base: form.basePrice,
          descricao: form.description || undefined,
          destaque: form.featured,
          qual_medida: form.attrs["Qual Medida"] || undefined,
          material: form.attrs.Material || undefined,
          composicao: form.attrs["Composição"] || undefined,
          silhueta: form.attrs.Silhueta || undefined,
          tags: form.tags?.length ? form.tags : undefined,
        });

        const variantsToCreate = variants.length
          ? variants
          : [{
              color: form.colors?.[0]?.name || "Único",
              size: form.sizes?.[0] || "U",
              stockOnline: 0,
              stockPhysical: 0,
              price: form.basePrice,
            }];
        const registeredImages = new Map<string, number>();
        const imageErrors: string[] = [];

        for (const variant of variantsToCreate) {
          const codigoSku = variants.length
            ? variant.codigoSku
            : form.sku;

          await api.post("/product-variants", {
            idProduto: createdProduct.idProduto,
            codigo_sku: codigoSku,
            preco_variante: variant.price || form.basePrice,
            ativo: true,
            cor: variant.color,
            tamanho: variant.size,
          });

          await api.patch(`/inventory/${encodeURIComponent(codigoSku)}`, {
            qtdOnline: variant.stockOnline || 0,
            qtdLojaFisica: variant.stockPhysical || 0,
            motivo: "Cadastro inicial",
            tipoMovimentacao: "ajuste",
          });

          // Imagens são opcionais: uma falha aqui (ex.: ImgBB indisponível/sem
          // chave) NÃO deve invalidar o produto/variante/estoque já criados.
          const color = form.colors.find((item: any) => item.name === variant.color);
          try {
            for (let index = 0; index < (color?.images?.length ?? 0); index += 1) {
              const source = color.images[index] as string;
              let imageId = registeredImages.get(source);

              if (!imageId && source.startsWith("data:image")) {
                const response = await fetch(source);
                const blob = await response.blob();
                const file = new File([blob], `img_${index}.jpg`, { type: blob.type });
                const formData = new FormData();
                formData.append("file", file);
                formData.append("ordem", String(index + 1));
                const uploaded = await api.post<{ idImagem: number }>("/images/upload", formData, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
                imageId = uploaded.idImagem;
              } else if (!imageId) {
                const registered = await api.post<{ idImagem: number }>("/images", {
                  url: source,
                  ordem: index + 1,
                });
                imageId = registered.idImagem;
              }
              registeredImages.set(source, imageId);

              await api.post("/images/catalog", {
                imageId,
                variantSku: codigoSku,
                ordem_no_catalogo: index + 1,
              });
            }
          } catch (imgErr) {
            console.warn(`Falha ao processar imagens da variante ${codigoSku}:`, imgErr);
            imageErrors.push(codigoSku);
          }
        }

        onCreated();
        if (imageErrors.length > 0) {
          alert(
            "Produto cadastrado com sucesso! Porém não foi possível enviar as imagens " +
            `das variantes: ${imageErrors.join(", ")}. ` +
            "Você pode adicioná-las depois pela edição do produto.",
          );
        } else {
          alert("Produto cadastrado com sucesso no banco de dados!");
        }
        return true;
      } catch (saveError) {
        console.error("Erro ao salvar produto no backend:", saveError);
        const message = saveError instanceof Error ? saveError.message : "Erro desconhecido";
        alert(
          `Não foi possível concluir o cadastro: ${message}. ` +
          "Verifique produto, variantes, estoque e imagens antes de tentar novamente.",
        );
      }
      return false;
    },
    [onCreated],
  );
}
