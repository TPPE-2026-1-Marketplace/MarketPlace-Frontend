import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { fetchProducts } from "@/lib/catalog";
import { makeProduct, makeVariant } from "@/test/factories";
import { employee, manager, renderWithProviders } from "@/test/render";
import { Inventory } from "./Inventory";

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  fetchProducts: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const catalog = [
  makeProduct({
    idProduto: 1,
    titulo: "Vestido Rosa",
    sku: "DK-ROSA",
    categories: [{ nome: "Debutante" }],
    variants: [
      makeVariant({ codigoSku: "ROSA-P", cor: "Rosa", tamanho: "P", precoVariante: 200, stock: { qtdOnline: 4, qtdLojaFisica: 2 } }),
      makeVariant({ codigoSku: "ROSA-M", cor: null, tamanho: null, precoVariante: 0, images: [], stock: { qtdOnline: 10, qtdLojaFisica: 5 } }),
    ],
  }),
  makeProduct({ idProduto: 2, titulo: "Saia Única", sku: "DK-SAIA", categories: [], variants: [makeVariant({ codigoSku: "SAIA-U", stock: { qtdOnline: 1, qtdLojaFisica: 0 } })] }),
  makeProduct({ idProduto: 3, titulo: "Rascunho", sku: "DK-RASC", precoBase: 50, categories: [], variants: [] }),
];

const row = (sku: string) => screen.getByText(sku).closest("tr") as HTMLElement;
const rowCount = () => screen.getAllByRole("row").length - 1;

async function renderInventory({ user = manager, readOnly = false } = {}) {
  renderWithProviders(<Inventory readOnly={readOnly} />, { user });
  await screen.findByText("ROSA-P");
}

async function applyFilters(values: { search?: string; channel?: string; availability?: string }) {
  const search = screen.getByLabelText("Buscar produto ou SKU");
  await userEvent.clear(search);
  if (values.search) await userEvent.type(search, values.search);
  await userEvent.selectOptions(screen.getByLabelText(/^Canal:/), values.channel ?? "all");
  await userEvent.selectOptions(screen.getByLabelText(/^Disponibilidade:/), values.availability ?? "all");
  await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
}

async function openAdjust(sku: string) {
  await userEvent.click(within(row(sku)).getByRole("button", { name: `Ajustar estoque de ${sku}` }));
  return screen.getByRole("dialog");
}

describe("Inventory", () => {
  beforeEach(() => {
    vi.mocked(fetchProducts).mockReset();
    vi.mocked(fetchProducts).mockResolvedValue({ data: catalog, meta: { page: 1, limit: 100, total: 3, totalPages: 1 } });
    for (const fn of [api.post, api.patch, api.delete]) vi.mocked(fn).mockReset();
    vi.mocked(api.get).mockResolvedValue({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("lista uma linha por variante com os indicadores, incluindo produto sem variantes", async () => {
    renderWithProviders(<Inventory />, { user: manager });
    expect(screen.getByText("Carregando dados")).toBeInTheDocument();
    await screen.findByText("ROSA-P");

    expect(screen.getByRole("heading", { level: 1, name: "Estoque" })).toBeInTheDocument();
    expect(screen.getByText("Total geral", { selector: "p" }).nextElementSibling).toHaveTextContent("22");
    expect(screen.getByText("4 variantes cadastradas")).toBeInTheDocument();
    expect(screen.getByText("Online", { selector: "p" }).nextElementSibling).toHaveTextContent("15");
    expect(screen.getByText("Loja física", { selector: "p" }).nextElementSibling).toHaveTextContent("07");
    // Só SAIA-U (1 unidade) está no limite; o produto sem variantes não conta.
    expect(screen.getByText("Estoque baixo", { selector: "p" }).nextElementSibling).toHaveTextContent("01");
    expect(within(row("ROSA-P")).getByText("Vestido Rosa · Rosa / P")).toBeInTheDocument();
    expect(within(row("ROSA-P")).getByText("R$ 200,00")).toBeInTheDocument();
    expect(within(row("ROSA-M")).getByText("Vestido Rosa")).toBeInTheDocument();
    expect(within(row("ROSA-M")).getByText("R$ 189,90")).toBeInTheDocument();
    expect(within(row("DK-RASC")).getByText("Rascunho · Sem variantes cadastradas")).toBeInTheDocument();
    expect(screen.getByText("Exibindo 4 registros")).toBeInTheDocument();
  });

  it("filtra por busca, canal e disponibilidade e limpa os filtros", async () => {
    await renderInventory();

    await applyFilters({ search: "dk-saia" });
    expect(rowCount()).toBe(1);
    await applyFilters({ channel: "physical" });
    expect(rowCount()).toBe(2);
    await applyFilters({ channel: "online", availability: "available" });
    expect(screen.getByText("ROSA-M")).toBeInTheDocument();
    expect(rowCount()).toBe(1);
    await applyFilters({ availability: "low" });
    expect(screen.getByText("SAIA-U")).toBeInTheDocument();
    expect(rowCount()).toBe(1);
    await applyFilters({ availability: "out" });
    expect(screen.getByText("DK-RASC")).toBeInTheDocument();

    await applyFilters({ search: "inexistente" });
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(rowCount()).toBe(4);
    expect(screen.getByLabelText("Buscar produto ou SKU")).toHaveValue("");
  });

  it("modo somente leitura esconde ações e o cadastro", async () => {
    await renderInventory({ readOnly: true, user: employee });

    expect(screen.queryByRole("button", { name: "Adicionar produto" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ajustar estoque/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Ação" })).not.toBeInTheDocument();
    expect(screen.getByText("Acesso conforme o perfil do usuário")).toBeInTheDocument();
  });

  it("ajusta o estoque de uma variante e confirma", async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("500"));
    await renderInventory();

    const dialog = await openAdjust("ROSA-P");
    expect(within(dialog).getByRole("heading", { name: "Ajustar estoque · Vestido Rosa" })).toBeInTheDocument();
    expect(within(dialog).getByText("Rosa / P · ROSA-P")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Quantidade online"), { target: { value: "7" } });
    fireEvent.change(within(dialog).getByLabelText("Quantidade loja física"), { target: { value: "-3" } });
    const fetchesBefore = vi.mocked(fetchProducts).mock.calls.length;
    await userEvent.click(within(dialog).getByRole("button", { name: "Salvar estoque" }));

    expect(api.patch).toHaveBeenCalledWith("/inventory/ROSA-P", {
      qtdOnline: 7,
      qtdLojaFisica: 0,
      motivo: "Ajuste pelo inventário",
      tipoMovimentacao: "ajuste",
    });
    expect(await screen.findByRole("heading", { name: "Alterações salvas" })).toBeInTheDocument();
    expect(screen.getByText("Estoque de ROSA-P atualizado: 7 online e 0 na loja")).toBeInTheDocument();
    // Depois de salvar, o inventário é recarregado.
    await waitFor(() => expect(vi.mocked(fetchProducts).mock.calls.length).toBeGreaterThan(fetchesBefore));
    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const second = await openAdjust("SAIA-U");
    await userEvent.click(within(second).getByRole("button", { name: "Salvar estoque" }));
    expect(await within(second).findByRole("alert")).toHaveTextContent("Não foi possível atualizar o estoque.");
    await userEvent.click(within(second).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    ["ROSA-P", "Excluir variante", "/product-variants/ROSA-P", "Variante ROSA-P excluída do catálogo"],
    ["SAIA-U", "Excluir produto", "/products/2", "Produto Saia Única excluído do catálogo"],
    ["DK-RASC", "Excluir produto", "/products/3", "Produto Rascunho excluído do catálogo"],
  ])("exclui %s pelo dialog com confirmação", async (sku, action, path, result) => {
    vi.mocked(api.delete).mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce({});
    await renderInventory();

    let dialog = await openAdjust(sku);
    await userEvent.click(within(dialog).getByRole("button", { name: action }));
    dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Esta ação não pode ser desfeita.")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(within(screen.getByRole("dialog")).getByRole("heading", { name: /^Ajustar estoque/ })).toBeInTheDocument();
    expect(api.delete).not.toHaveBeenCalled();

    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: action }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: action }));
    expect(await screen.findByText("Não foi possível concluir a exclusão.")).toBeInTheDocument();

    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: action }));
    expect(api.delete).toHaveBeenLastCalledWith(path);
    expect(await screen.findByText(result)).toBeInTheDocument();
  });

  it("produto sem variantes não tem quantidades para ajustar", async () => {
    await renderInventory();

    const dialog = await openAdjust("DK-RASC");
    expect(within(dialog).getByText("Cadastre uma variante para controlar o estoque deste produto")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Salvar estoque" })).not.toBeInTheDocument();
  });

  it("mostra o erro de carregamento do catálogo e tenta de novo", async () => {
    vi.mocked(fetchProducts).mockRejectedValue(new Error("Catálogo indisponível"));
    renderWithProviders(<Inventory />, { user: manager });

    expect(await screen.findByText("Catálogo indisponível")).toBeInTheDocument();
    const calls = vi.mocked(fetchProducts).mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(vi.mocked(fetchProducts).mock.calls.length).toBeGreaterThan(calls));
  });
});

describe("Inventory - cadastro e edição de produto", () => {
  beforeEach(() => {
    vi.mocked(fetchProducts).mockResolvedValue({ data: catalog, meta: { page: 1, limit: 100, total: 3, totalPages: 1 } });
    vi.mocked(api.get).mockResolvedValue({ data: [{ idCategoria: 1, nome: "Festa" }], meta: { page: 1, limit: 100, total: 1, totalPages: 1 } });
  });

  it("abre o assistente de cadastro e fecha sem salvar", async () => {
    await renderInventory();

    await userEvent.click(screen.getByRole("button", { name: "Adicionar produto" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Cadastrar produto" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Informação básica" })).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(api.post).not.toHaveBeenCalled();
  });

  it("abre a edição do produto a partir do ajuste de estoque", async () => {
    await renderInventory();

    await openAdjust("ROSA-P");
    await userEvent.click(screen.getByRole("button", { name: "Editar produto" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Editar produto" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Título *")).toHaveValue("Vestido Rosa");
    expect(within(dialog).getByLabelText("SKU base *")).toBeDisabled();
  });

  it("perfil somente leitura não abre a edição", async () => {
    await renderInventory({ readOnly: true });

    expect(screen.queryByRole("button", { name: /Ajustar estoque/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar produto" })).not.toBeInTheDocument();
  });
});
