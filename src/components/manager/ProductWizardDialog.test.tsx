import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SaveResult } from "@/hooks/useProductPersistence";
import { ApiError } from "@/lib/api";
import { PRODUCT_DRAFT_STORAGE_KEY, type ProductDraft } from "@/lib/productDraft";
import { makeProduct, makeVariant } from "@/test/factories";
import ProductWizardDialog from "./ProductWizardDialog";

const categories = [
  { idCategoria: 1, nome: "Festa" },
  { idCategoria: 4, nome: "Vestidos" },
];

const dialog = () => within(screen.getByRole("dialog"));

function renderWizard(mode: Parameters<typeof ProductWizardDialog>[0]["mode"] = { kind: "create" }) {
  const onCreate = vi.fn<(draft: ProductDraft) => Promise<SaveResult>>().mockResolvedValue({ imageFailures: [] });
  const onUpdate = vi
    .fn<(id: number, original: ProductDraft, draft: ProductDraft) => Promise<SaveResult>>()
    .mockResolvedValue({ imageFailures: [] });
  const onClose = vi.fn();
  render(<ProductWizardDialog mode={mode} categories={categories} onClose={onClose} onCreate={onCreate} onUpdate={onUpdate} />);
  return { onCreate, onUpdate, onClose };
}

async function fillBasic() {
  await userEvent.type(dialog().getByLabelText("Título *"), "Princesa Rosé");
  await userEvent.type(dialog().getByLabelText("Descrição *"), "Tule com brilho");
  await userEvent.type(dialog().getByLabelText("SKU base *"), "dk-009");
}

const next = () => userEvent.click(dialog().getByRole("button", { name: "Próxima etapa" }));

describe("ProductWizardDialog - cadastro", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("valida cada etapa, gera as variantes e publica após a revisão", async () => {
    const { onCreate, onClose } = renderWizard();
    expect(dialog().getByRole("heading", { name: "Cadastrar produto" })).toBeInTheDocument();

    await next();
    expect(dialog().getByRole("alert")).toHaveTextContent("Informe o título do produto.");
    await fillBasic();
    expect(dialog().getByLabelText("SKU base *")).toHaveValue("DK-009");
    await userEvent.selectOptions(dialog().getByLabelText("Produto em destaque"), "sim");
    await next();

    expect(dialog().getByRole("heading", { name: "Categoria e atributos" })).toBeInTheDocument();
    await next();
    expect(dialog().getByRole("alert")).toHaveTextContent("Selecione ao menos uma categoria.");
    await userEvent.click(dialog().getByLabelText("Festa"));
    await userEvent.type(dialog().getByLabelText("Material"), "Tule");
    await userEvent.selectOptions(dialog().getByLabelText("Qual medida"), "Longo");
    await userEvent.type(dialog().getByLabelText("Tags e palavras-chave"), "Brilho{Enter}");
    await userEvent.click(dialog().getByRole("button", { name: "gala" }));
    await userEvent.click(dialog().getByRole("button", { name: "Remover tag brilho" }));
    await next();

    expect(dialog().getByRole("heading", { name: "Venda e imagens" })).toBeInTheDocument();
    await next();
    expect(dialog().getByRole("alert")).toHaveTextContent("Informe um preço base maior que zero.");
    await userEvent.type(dialog().getByLabelText("Preço base *"), "599.9");
    await userEvent.click(dialog().getByRole("button", { name: "M" }));
    await userEvent.click(dialog().getByRole("button", { name: "G" }));
    await next();
    expect(dialog().getByRole("alert")).toHaveTextContent("Adicione ao menos uma cor.");

    await userEvent.click(dialog().getByRole("button", { name: "Adicionar cor" }));
    expect(dialog().getByRole("alert")).toHaveTextContent("Informe o nome da nova cor.");
    await userEvent.click(dialog().getByRole("button", { name: "Rosa Bebê" }));
    await userEvent.click(dialog().getByRole("button", { name: "Adicionar cor" }));
    await userEvent.type(dialog().getByLabelText("Nome"), "rosa bebê");
    await userEvent.click(dialog().getByRole("button", { name: "Adicionar cor" }));
    expect(dialog().getByRole("alert")).toHaveTextContent("A cor rosa bebê já foi adicionada.");
    await userEvent.clear(dialog().getByLabelText("Nome"));
    await userEvent.type(dialog().getByLabelText("Nome"), "Preto");
    await userEvent.click(dialog().getByRole("button", { name: "Adicionar cor" }));
    expect(dialog().getByText("Nome da cor *").nextElementSibling).toHaveTextContent("Preto");
    await next();

    expect(dialog().getByRole("heading", { name: "Gestão de estoque" })).toBeInTheDocument();
    expect(dialog().getAllByRole("listitem", { name: /^Variante/ })).toHaveLength(4);
    expect(dialog().getByText(/DK009-ROSABEBE-M/)).toBeInTheDocument();
    await userEvent.clear(dialog().getByLabelText("Quantidade online"));
    await userEvent.type(dialog().getByLabelText("Quantidade online"), "3");
    await userEvent.type(dialog().getByLabelText("Quantidade física"), "1");
    await userEvent.click(dialog().getByRole("button", { name: "Aplicar às variantes" }));
    await userEvent.clear(dialog().getByLabelText("Online", { selector: "#online-DK009-PRETO-G" }));
    await userEvent.type(dialog().getByLabelText("Online", { selector: "#online-DK009-PRETO-G" }), "7");
    expect(dialog().getByText("Online", { selector: "span" }).nextElementSibling).toHaveTextContent("16 unidades");
    await userEvent.click(dialog().getByRole("button", { name: "Revisar produto" }));

    expect(dialog().getByRole("heading", { name: "Revisar cadastro" })).toBeInTheDocument();
    expect(dialog().getByText("SKU DK-009 · Festa")).toBeInTheDocument();
    expect(dialog().getByText("Tags: gala")).toBeInTheDocument();
    expect(dialog().getAllByText("Sem fotos desta cor")).toHaveLength(2);
    expect(dialog().getByText("4 variantes").closest("tr")).toHaveTextContent("4 variantes16420");

    await userEvent.click(dialog().getByRole("button", { name: "Editar informação básica" }));
    expect(dialog().getByLabelText("Título *")).toHaveValue("Princesa Rosé");
    await userEvent.click(dialog().getByRole("button", { name: "4 · Gestão de estoque" }));
    await userEvent.click(dialog().getByRole("button", { name: "Revisar produto" }));
    await userEvent.click(dialog().getByRole("button", { name: "Confirmar e publicar" }));

    const published = onCreate.mock.calls[0][0];
    expect(published).toMatchObject({
      title: "Princesa Rosé",
      sku: "DK-009",
      featured: true,
      categoryIds: [1],
      material: "Tule",
      length: "Longo",
      tags: ["gala"],
      basePrice: 599.9,
      sizes: ["M", "G"],
    });
    expect(published.variants.map((variant) => [variant.sku, variant.online, variant.physical])).toEqual([
      ["DK009-ROSABEBE-M", 3, 1],
      ["DK009-ROSABEBE-G", 3, 1],
      ["DK009-PRETO-M", 3, 1],
      ["DK009-PRETO-G", 7, 1],
    ]);
    expect(await screen.findByRole("heading", { name: "Produto publicado" })).toBeInTheDocument();
    expect(dialog().getByText("Princesa Rosé foi publicado com 4 variantes.")).toBeInTheDocument();
    await userEvent.click(dialog().getByRole("button", { name: "Voltar ao estoque" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("salva o rascunho no navegador e o restaura no próximo cadastro", async () => {
    const first = renderWizard();
    await fillBasic();
    await userEvent.click(dialog().getByRole("button", { name: "Salvar rascunho" }));
    expect(dialog().getByRole("status")).toHaveTextContent("Rascunho salvo neste navegador");
    expect(JSON.parse(localStorage.getItem(PRODUCT_DRAFT_STORAGE_KEY) ?? "{}")).toMatchObject({ title: "Princesa Rosé" });
    await userEvent.click(dialog().getByRole("button", { name: "Cancelar" }));
    expect(first.onClose).toHaveBeenCalled();
  });

  it("restaura o rascunho salvo e mostra o erro da API ao publicar", async () => {
    localStorage.setItem(
      PRODUCT_DRAFT_STORAGE_KEY,
      JSON.stringify({ title: "Rascunho", description: "D", sku: "DK-1", categoryIds: [4], basePrice: 10, sizes: ["U"], colors: [{ name: "Preto", hex: "#000000", images: [] }], variants: [] }),
    );
    const { onCreate } = renderWizard();
    onCreate.mockRejectedValueOnce(new ApiError(409, "SKU já cadastrado"));

    expect(dialog().getByRole("status")).toHaveTextContent("Rascunho restaurado");
    expect(dialog().getByLabelText("Título *")).toHaveValue("Rascunho");
    await next();
    await next();
    await next();
    await userEvent.click(dialog().getByRole("button", { name: "Revisar produto" }));
    await userEvent.click(dialog().getByRole("button", { name: "Confirmar e publicar" }));
    expect(await dialog().findByRole("alert")).toHaveTextContent("Não foi possível salvar: SKU já cadastrado");
    expect(localStorage.getItem(PRODUCT_DRAFT_STORAGE_KEY)).not.toBeNull();
  });
});

describe("ProductWizardDialog - edição", () => {
  const product = makeProduct({
    idProduto: 9,
    titulo: "Princesa Rosé",
    sku: "DK-009",
    precoBase: 599.9,
    categories: [{ idCategoria: 1, nome: "Festa" }],
    variants: [makeVariant({ codigoSku: "DK009-ROSA-M", cor: "Rosa", tamanho: "M", precoVariante: 599.9, stock: { qtdOnline: 4, qtdLojaFisica: 2 } })],
  });

  it("revisa só o que mudou e salva", async () => {
    const { onUpdate } = renderWizard({ kind: "edit", product });

    expect(dialog().getByRole("heading", { name: "Editar produto" })).toBeInTheDocument();
    expect(dialog().queryByRole("button", { name: "Salvar rascunho" })).not.toBeInTheDocument();
    expect(dialog().getByLabelText("SKU base *")).toBeDisabled();
    await userEvent.clear(dialog().getByLabelText("Título *"));
    await userEvent.type(dialog().getByLabelText("Título *"), "Princesa Rosé Premium");
    // Edição: todas as etapas já liberadas.
    await userEvent.click(dialog().getByRole("button", { name: "4 · Gestão de estoque" }));
    await userEvent.clear(dialog().getByLabelText("Online"));
    await userEvent.type(dialog().getByLabelText("Online"), "6");
    await userEvent.click(dialog().getByRole("button", { name: "Revisar alterações" }));

    expect(dialog().getByRole("heading", { name: "Revisar alterações" })).toBeInTheDocument();
    expect(dialog().getByText("2 campos alterados · Os demais dados serão mantidos.")).toBeInTheDocument();
    expect(dialog().getByText("Estoque online · Rosa / M")).toBeInTheDocument();
    await userEvent.click(dialog().getByRole("button", { name: "Confirmar e salvar" }));

    expect(onUpdate).toHaveBeenCalledWith(9, expect.objectContaining({ title: "Princesa Rosé" }), expect.objectContaining({ title: "Princesa Rosé Premium" }));
    expect(await screen.findByRole("heading", { name: "Alterações salvas" })).toBeInTheDocument();
  });

  it("não deixa salvar sem alterações e avisa fotos que falharam", async () => {
    const { onUpdate } = renderWizard({ kind: "edit", product });
    onUpdate.mockResolvedValueOnce({ imageFailures: ["Rosa (foto 2)"] });

    await userEvent.click(dialog().getByRole("button", { name: "4 · Gestão de estoque" }));
    await userEvent.click(dialog().getByRole("button", { name: "Revisar alterações" }));
    expect(dialog().getByText("Nenhum campo foi alterado.")).toBeInTheDocument();
    expect(dialog().getByRole("button", { name: "Confirmar e salvar" })).toBeDisabled();

    await userEvent.click(dialog().getByRole("button", { name: "Voltar à edição" }));
    await userEvent.click(dialog().getByRole("button", { name: "1 · Informação básica" }));
    await userEvent.selectOptions(dialog().getByLabelText("Produto em destaque"), "nao");
    await userEvent.click(dialog().getByRole("button", { name: "4 · Gestão de estoque" }));
    await userEvent.click(dialog().getByRole("button", { name: "Revisar alterações" }));
    await userEvent.click(dialog().getByRole("button", { name: "Confirmar e salvar" }));
    await waitFor(() => expect(dialog().getByRole("alert")).toHaveTextContent("Rosa (foto 2)"));
  });
});
