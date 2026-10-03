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

// O AddProduct (assistente de cadastro) é testado à parte: aqui ele só entrega o
// payload para o Inventory persistir no backend.
const addProductPayload = vi.hoisted(() => ({ current: undefined as unknown }));
vi.mock("./AddProduct", () => ({
  AddProduct: ({ onBack, onSave }: { onBack: () => void; onSave: (p: object, payload?: unknown) => void }) => (
    <div>
      <p>Assistente de cadastro</p>
      <button onClick={onBack}>Voltar ao estoque</button>
      <button onClick={() => onSave({}, addProductPayload.current)}>Salvar cadastro</button>
    </div>
  ),
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

const rows = () => screen.getAllByRole("row").slice(1);
const row = (sku: string) => screen.getByText(sku).closest("tr") as HTMLElement;

async function renderInventory({ user = manager, readOnly = false } = {}) {
  renderWithProviders(<Inventory readOnly={readOnly} />, { user });
  await screen.findByText("ROSA-P");
}

describe("Inventory", () => {
  beforeEach(() => {
    vi.mocked(fetchProducts).mockReset();
    vi.mocked(fetchProducts).mockResolvedValue({ data: catalog, meta: { page: 1, limit: 100, total: 3, totalPages: 1 } });
    for (const fn of [api.post, api.patch, api.delete]) vi.mocked(fn).mockReset();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    addProductPayload.current = undefined;
  });

  it("lista uma linha por variante, incluindo produto sem variantes", async () => {
    renderWithProviders(<Inventory />, { user: manager });
    expect(screen.getByText("Carregando inventário...")).toBeInTheDocument();
    await screen.findByText("ROSA-P");

    expect(screen.getByText("4 variantes cadastradas")).toBeInTheDocument();
    expect(screen.getByText("Total Geral").nextElementSibling).toHaveTextContent("22");
    expect(within(row("ROSA-P")).getByText("Rosa · P")).toBeInTheDocument();
    expect(within(row("ROSA-M")).getByText("Variante padrão")).toBeInTheDocument();
    expect(within(row("ROSA-M")).getByText("R$ 189,90")).toBeInTheDocument();
    expect(within(row("DK-RASC")).getByText("Sem variantes cadastradas")).toBeInTheDocument();
    expect(within(row("DK-RASC")).getByTitle("Excluir produto")).toBeInTheDocument();
  });

  it("filtra por busca, categoria e tipo de estoque", async () => {
    await renderInventory();

    await userEvent.type(screen.getByPlaceholderText("Buscar por produto, SKU base ou SKU da variante..."), "dk-saia");
    expect(rows()).toHaveLength(1);
    await userEvent.clear(screen.getByPlaceholderText("Buscar por produto, SKU base ou SKU da variante..."));

    await userEvent.click(screen.getByRole("button", { name: "debutante" }));
    expect(rows()).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Todas" }));

    await userEvent.click(screen.getByRole("button", { name: "Online" }));
    expect(screen.queryByRole("columnheader", { name: "Loja" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Loja" }));
    expect(screen.queryByRole("columnheader", { name: "Online" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Todos" }));

    await userEvent.type(screen.getByPlaceholderText("Buscar por produto, SKU base ou SKU da variante..."), "inexistente");
    expect(screen.getByText("Nenhuma variante encontrada.")).toBeInTheDocument();
  });

  it("modo somente leitura esconde ações e o cadastro", async () => {
    await renderInventory({ readOnly: true });

    expect(screen.getByText("Controle de Estoque (Visualização)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Novo Produto/ })).not.toBeInTheDocument();
    expect(screen.queryByTitle("Editar estoque")).not.toBeInTheDocument();
  });

  it("funcionário ajusta estoque mas não exclui", async () => {
    await renderInventory({ user: employee });

    expect(screen.queryByTitle("Excluir variante")).not.toBeInTheDocument();
    expect(screen.getAllByTitle("Editar estoque")).toHaveLength(4);
  });

  it("ajusta o estoque de uma variante", async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("500"));
    await renderInventory();

    await userEvent.click(within(row("ROSA-P")).getByTitle("Editar estoque"));
    const [online, fisica] = within(row("ROSA-P")).getAllByRole("spinbutton");
    fireEvent.change(online, { target: { value: "7" } });
    fireEvent.change(fisica, { target: { value: "-3" } });
    expect(within(row("ROSA-P")).getAllByRole("cell")[5]).toHaveTextContent("7");
    const fetchesBefore = vi.mocked(fetchProducts).mock.calls.length;
    await userEvent.click(within(row("ROSA-P")).getByTitle("Salvar estoque"));

    expect(api.patch).toHaveBeenCalledWith("/inventory/ROSA-P", {
      qtdOnline: 7,
      qtdLojaFisica: 0,
      motivo: "Ajuste pelo inventário",
      tipoMovimentacao: "ajuste",
    });
    // Depois de salvar, o inventário é recarregado.
    await waitFor(() => expect(vi.mocked(fetchProducts).mock.calls.length).toBeGreaterThan(fetchesBefore));

    await userEvent.click(within(row("SAIA-U")).getByTitle("Editar estoque"));
    await userEvent.click(within(row("SAIA-U")).getByTitle("Salvar estoque"));
    expect(window.alert).toHaveBeenCalledWith("Não foi possível atualizar o estoque.");
    await userEvent.click(within(row("SAIA-U")).getByTitle("Cancelar"));
    expect(within(row("SAIA-U")).queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it.each([
    ["ROSA-P", "Tem certeza que deseja excluir esta variante? Esta ação não pode ser desfeita.", "/product-variants/ROSA-P", "Variante excluída com sucesso."],
    ["SAIA-U", "Esta é a última variante. Excluí-la irá remover o produto inteiro do sistema. Deseja continuar?", "/products/2", "Produto excluído com sucesso."],
    ["DK-RASC", "Tem certeza que deseja excluir este produto sem variantes?", "/products/3", "Produto excluído com sucesso."],
  ])("exclui %s com a confirmação adequada", async (sku, question, path, success) => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    vi.mocked(api.delete).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("500"));
    await renderInventory();
    const button = () => within(row(sku)).getByTitle(/Excluir/);

    await userEvent.click(button());
    expect(confirm).toHaveBeenCalledWith(question);
    expect(api.delete).not.toHaveBeenCalled();

    await userEvent.click(button());
    expect(api.delete).toHaveBeenCalledWith(path);
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(success));

    await userEvent.click(button());
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/^Não foi possível excluir/)));
  });

  it("mostra o erro de carregamento do catálogo", async () => {
    vi.mocked(fetchProducts).mockRejectedValue(new Error("Catálogo indisponível"));
    renderWithProviders(<Inventory />, { user: manager });

    expect(await screen.findByText("Catálogo indisponível")).toBeInTheDocument();
  });
});

describe("Inventory - cadastro de produto", () => {
  const baseForm = {
    title: "Vestido Novo",
    sku: "DK-NOVO",
    basePrice: 300,
    description: "",
    featured: true,
    attrs: { Material: "Tule" },
    tags: ["festa"],
    colors: [
      { name: "Preto", images: ["https://img/preto.jpg", "data:image/png;base64,AAA"] },
      { name: "Branco", images: ["https://img/preto.jpg"] },
    ],
    sizes: ["M"],
  };

  beforeEach(() => {
    vi.mocked(fetchProducts).mockResolvedValue({ data: catalog, meta: { page: 1, limit: 100, total: 3, totalPages: 1 } });
    for (const fn of [api.post, api.patch, api.delete]) vi.mocked(fn).mockReset();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(api.patch).mockResolvedValue({});
  });

  async function openAddProduct() {
    renderWithProviders(<Inventory />, { user: manager });
    await screen.findByText("ROSA-P");
    await userEvent.click(screen.getByRole("button", { name: /Novo Produto/ }));
    expect(screen.getByText("Assistente de cadastro")).toBeInTheDocument();
  }

  it("volta ao estoque sem salvar", async () => {
    await openAddProduct();
    await userEvent.click(screen.getByRole("button", { name: "Voltar ao estoque" }));
    expect(screen.getByText("ROSA-P")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Novo Produto/ }));
    addProductPayload.current = undefined;
    await userEvent.click(screen.getByRole("button", { name: "Salvar cadastro" }));
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByText("ROSA-P")).toBeInTheDocument();
  });

  it("cria produto, variantes, estoque e imagens (reaproveitando a mesma URL)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ blob: async () => new Blob(["x"], { type: "image/png" }) })));
    let imageId = 0;
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === "/products") return { idProduto: 99 };
      if (path === "/images" || path === "/images/upload") return { idImagem: ++imageId };
      return {};
    });
    addProductPayload.current = {
      form: baseForm,
      variants: [
        { codigoSku: "NOVO-PRETO-M", color: "Preto", size: "M", price: 0, stockOnline: 3, stockPhysical: 1 },
        { codigoSku: "NOVO-BRANCO-M", color: "Branco", size: "M", price: 320 },
      ],
    };
    await openAddProduct();

    await userEvent.click(screen.getByRole("button", { name: "Salvar cadastro" }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Produto cadastrado com sucesso no banco de dados!"));
    expect(api.post).toHaveBeenCalledWith("/products", expect.objectContaining({
      titulo: "Vestido Novo",
      sku: "DK-NOVO",
      preco_base: 300,
      descricao: undefined,
      material: "Tule",
      tags: ["festa"],
    }));
    expect(api.post).toHaveBeenCalledWith("/product-variants", expect.objectContaining({ codigo_sku: "NOVO-PRETO-M", preco_variante: 300 }));
    expect(api.post).toHaveBeenCalledWith("/product-variants", expect.objectContaining({ codigo_sku: "NOVO-BRANCO-M", preco_variante: 320 }));
    expect(api.patch).toHaveBeenCalledWith("/inventory/NOVO-PRETO-M", expect.objectContaining({ qtdOnline: 3, qtdLojaFisica: 1 }));
    expect(api.patch).toHaveBeenCalledWith("/inventory/NOVO-BRANCO-M", expect.objectContaining({ qtdOnline: 0, qtdLojaFisica: 0 }));
    // URL registrada uma vez e reaproveitada na segunda variante; data URI vai por upload.
    expect(vi.mocked(api.post).mock.calls.filter(([p]) => p === "/images")).toHaveLength(1);
    expect(vi.mocked(api.post).mock.calls.filter(([p]) => p === "/images/upload")).toHaveLength(1);
    expect(vi.mocked(api.post).mock.calls.filter(([p]) => p === "/images/catalog")).toHaveLength(3);
    expect(await screen.findByText("ROSA-P")).toBeInTheDocument();
  });

  it("cria uma variante padrão quando o assistente não define variantes", async () => {
    vi.mocked(api.post).mockImplementation(async (path: string) => (path === "/products" ? { idProduto: 5 } : {}));
    addProductPayload.current = { form: { ...baseForm, attrs: {}, tags: [], colors: [], sizes: [] }, variants: [] };
    await openAddProduct();

    await userEvent.click(screen.getByRole("button", { name: "Salvar cadastro" }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Produto cadastrado com sucesso no banco de dados!"));
    expect(api.post).toHaveBeenCalledWith("/product-variants", expect.objectContaining({ codigo_sku: "DK-NOVO", cor: "Único", tamanho: "U" }));
  });

  it("avisa quando as imagens falham mas mantém o produto", async () => {
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === "/products") return { idProduto: 99 };
      if (path === "/images") throw new Error("ImgBB fora");
      return {};
    });
    addProductPayload.current = { form: baseForm, variants: [{ codigoSku: "NOVO-PRETO-M", color: "Preto", size: "M" }] };
    await openAddProduct();

    await userEvent.click(screen.getByRole("button", { name: "Salvar cadastro" }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("variantes: NOVO-PRETO-M")));
  });

  it("explica a falha quando o cadastro do produto não conclui", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("SKU duplicado"));
    addProductPayload.current = { form: baseForm, variants: [] };
    await openAddProduct();

    await userEvent.click(screen.getByRole("button", { name: "Salvar cadastro" }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Não foi possível concluir o cadastro: SKU duplicado.")));
    expect(screen.getByText("Assistente de cadastro")).toBeInTheDocument();

    vi.mocked(api.post).mockRejectedValueOnce("erro estranho");
    await userEvent.click(screen.getByRole("button", { name: "Salvar cadastro" }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Erro desconhecido")));
  });
});
