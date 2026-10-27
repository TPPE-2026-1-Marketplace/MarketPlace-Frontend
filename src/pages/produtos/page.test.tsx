import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchProducts } from "@/lib/catalog";
import { makeProduct, makeVariant } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import ProdutosPage from "./page";

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  fetchProducts: vi.fn(),
}));

const catalog = [
  makeProduct({ idProduto: 1, titulo: "Vestido Rosa", variants: [makeVariant({ codigoSku: "R", precoVariante: 300, cor: "Rosa", tamanho: "38" })] }),
  makeProduct({ idProduto: 2, titulo: "Vestido Azul", variants: [makeVariant({ codigoSku: "A", precoVariante: 1200, cor: "Azul Safira", tamanho: "42" })] }),
  makeProduct({ idProduto: 3, titulo: "Vestido Preto", variants: [makeVariant({ codigoSku: "P", precoVariante: 800, cor: "Preto", tamanho: "42" })] }),
];

const titles = () =>
  screen.getAllByText(/^Vestido (Rosa|Azul|Preto)$/).map((el) => el.textContent);

async function renderPage(route = "/produtos") {
  renderWithProviders(<ProdutosPage />, { route });
  await screen.findByText("Vestido Rosa");
}

describe("ProdutosPage", () => {
  beforeEach(() => {
    vi.mocked(fetchProducts).mockResolvedValue({ data: catalog, meta: { page: 1, limit: 20, total: 3, totalPages: 1 } });
  });

  it("lista todos os vestidos com o título padrão", async () => {
    renderWithProviders(<ProdutosPage />, { route: "/produtos" });
    expect(document.querySelectorAll(".animate-pulse")).toHaveLength(6);

    await screen.findByText("Vestido Rosa");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Todos os Vestidos");
    expect(screen.getByText("3 vestidos encontrados")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Limpar$/ })).not.toBeInTheDocument();
  });

  it("mostra a nota e a contagem nos cards que têm avaliações", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [
        { ...catalog[0], mediaAvaliacao: 4.5, totalAvaliacoes: 12 },
        { ...catalog[1], mediaAvaliacao: 0, totalAvaliacoes: 0 },
      ],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
    await renderPage();

    expect(screen.getByLabelText("Nota 4,5 de 5, 12 avaliações")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Nota /)).toHaveLength(1);
  });

  it("usa a busca e a categoria da URL no título", async () => {
    await renderPage("/produtos?busca=rosa");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent('Busca: "rosa"');
  });

  it("mostra o nome da categoria escolhida", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [{ ...catalog[0], categories: [{ idCategoria: 3, nome: "Formatura" }] }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    await renderPage("/produtos?categoria=formatura");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Formatura");
    expect(screen.getByRole("link", { name: "Formatura" })).toHaveClass("bg-[var(--action-primary)]");
  });

  it("filtra pela categoria da URL e marca o comprimento da URL", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [
        { ...catalog[0], categories: [{ idCategoria: 2, nome: "Festa" }], tipo: "midi" },
        { ...catalog[1], categories: [{ idCategoria: 2, nome: "Festa" }], tipo: "midi" },
        catalog[2],
      ],
      meta: { page: 1, limit: 20, total: 3, totalPages: 1 },
    });

    await renderPage("/produtos?categoria=festa&tipo=midi");
    expect(titles()).toEqual(["Vestido Rosa", "Vestido Azul"]);
    expect(screen.getByRole("radio", { name: "Midi" })).toBeChecked();

    await userEvent.click(screen.getByRole("radio", { name: "Longo" }));
    expect(screen.getByTestId("location").textContent).toBe("/produtos?categoria=festa&tipo=longo");
  });

  it("ordena por preço e por novidade", async () => {
    await renderPage();
    const combobox = screen.getByRole("combobox");

    await userEvent.click(combobox);
    await userEvent.click(screen.getByRole("option", { name: "Menor Preço" }));
    expect(titles()).toEqual(["Vestido Rosa", "Vestido Preto", "Vestido Azul"]);

    await userEvent.click(combobox);
    await userEvent.click(screen.getByRole("option", { name: "Maior Preço" }));
    expect(titles()).toEqual(["Vestido Azul", "Vestido Preto", "Vestido Rosa"]);

    await userEvent.click(combobox);
    await userEvent.click(screen.getByRole("option", { name: "Novidade" }));
    expect(titles()).toEqual(["Vestido Preto", "Vestido Azul", "Vestido Rosa"]);
  });

  it("filtra por tamanho, cor e preço e limpa os filtros", async () => {
    await renderPage();

    await userEvent.click(screen.getByRole("button", { name: "42" }));
    expect(titles()).toEqual(["Vestido Azul", "Vestido Preto"]);

    await userEvent.click(screen.getByRole("checkbox", { name: "Preto" }));
    expect(titles()).toEqual(["Vestido Preto"]);
    expect(screen.getByText("1 vestido encontrado")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: "Preto" }));
    await userEvent.click(screen.getByRole("button", { name: "42" }));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "500" } });
    expect(titles()).toEqual(["Vestido Rosa"]);
    expect(screen.getByText("R$ 500")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("slider"), { target: { value: "100" } });
    expect(screen.getByText("Nenhum vestido encontrado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar Filtros" }));
    expect(titles()).toHaveLength(3);

    await userEvent.click(screen.getByRole("radio", { name: "Midi" }));
    await userEvent.click(screen.getByRole("button", { name: /Limpar$/ }));
    expect(screen.getByRole("radio", { name: "Todos" })).toBeChecked();
  });

  it("abre os filtros no mobile e indica filtros ativos", async () => {
    await renderPage("/produtos?busca=vestido");
    const toggle = screen.getByRole("button", { name: /Filtros/ });
    expect(within(toggle).getByText("!")).toBeInTheDocument();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByText("Aplicar filtros")).toBeInTheDocument();
  });

  it("exibe chips de filtros ativos e permite remoção individual", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [
        { ...catalog[0], categories: [{ idCategoria: 2, nome: "Festa" }], tipo: "midi" },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    await renderPage("/produtos?categoria=festa&tipo=midi");
    expect(screen.getByText("Categoria: Festa")).toBeInTheDocument();
    expect(screen.getByText("Comprimento: Midi")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remover filtro de comprimento" }));
    expect(screen.getByTestId("location").textContent).toBe("/produtos?categoria=festa");
  });

  it("permite digitar intervalo específico de preço nos inputs mínimo e máximo", async () => {
    await renderPage("/produtos");
    const minInputs = screen.getAllByLabelText("Preço mínimo em reais");
    const maxInputs = screen.getAllByLabelText("Preço máximo em reais");

    // Usar o primeiro input (desktop)
    // Vestido Rosa custa 300, Vestido Preto custa 800, Vestido Azul custa 1200
    fireEvent.change(minInputs[0], { target: { value: "400" } });
    fireEvent.change(maxInputs[0], { target: { value: "1000" } });

    expect(screen.getByText("1 vestido encontrado")).toBeInTheDocument();
    expect(screen.getByText("Vestido Preto")).toBeInTheDocument();
    expect(screen.queryByText("Vestido Rosa")).not.toBeInTheDocument();
    expect(screen.queryByText("Vestido Azul")).not.toBeInTheDocument();

    expect(screen.getByText(/Preço: R\$ 400 - R\$ 1\.000/)).toBeInTheDocument();
  });

  it("extrai cores dinamicamente das variantes e filtra de forma case-insensitive", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [
        makeProduct({
          idProduto: 10,
          titulo: "Vestido Gala Azul",
          variants: [makeVariant({ codigoSku: "VG-AZUL", cor: "azul marinho", tamanho: "M" })],
        }),
        makeProduct({
          idProduto: 11,
          titulo: "Vestido Gala Preto",
          variants: [makeVariant({ codigoSku: "VG-PRETO", cor: "preto", tamanho: "G" })],
        }),
      ],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });

    renderWithProviders(<ProdutosPage />, { route: "/produtos" });
    await screen.findByText("Vestido Gala Azul");

    // As opções de cores devem ser derivadas dinamicamente dos vestidos (Azul Marinho e Preto)
    expect(screen.getByRole("checkbox", { name: "Azul Marinho" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Preto" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Lilás" })).not.toBeInTheDocument();

    // Clicar em "Azul Marinho" deve filtrar com case-insensitivity ("azul marinho" no backend)
    await userEvent.click(screen.getByRole("checkbox", { name: "Azul Marinho" }));
    expect(screen.getByText("1 vestido encontrado")).toBeInTheDocument();
    expect(screen.getByText("Vestido Gala Azul")).toBeInTheDocument();
    expect(screen.queryByText("Vestido Gala Preto")).not.toBeInTheDocument();
    expect(screen.getByText("Cor: Azul Marinho")).toBeInTheDocument();
  });

  it("renderiza empty state de erro quando a API falha", async () => {
    vi.mocked(fetchProducts).mockRejectedValue(new Error("Falha no servidor"));
    renderWithProviders(<ProdutosPage />, { route: "/produtos" });

    await screen.findByText("Erro ao carregar vestidos");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("filtra vestidos pelo comprimento selecionado (midi, longo, longuete)", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [
        { ...catalog[0], idProduto: 1, titulo: "Vestido Midi Charm", tipo: "midi" },
        { ...catalog[1], idProduto: 2, titulo: "Vestido Longo Noite", tipo: "longo" },
        { ...catalog[2], idProduto: 3, titulo: "Vestido Longuete Flor", tipo: "longuete" },
      ],
      meta: { page: 1, limit: 20, total: 3, totalPages: 1 },
    });

    renderWithProviders(<ProdutosPage />, { route: "/produtos?tipo=midi" });
    await screen.findByText("Vestido Midi Charm");

    expect(screen.getByText("Vestido Midi Charm")).toBeInTheDocument();
    expect(screen.queryByText("Vestido Longo Noite")).not.toBeInTheDocument();
    expect(screen.queryByText("Vestido Longuete Flor")).not.toBeInTheDocument();

    // Trocar para longo
    await userEvent.click(screen.getByRole("radio", { name: "Longo" }));
    expect(screen.getByText("Vestido Longo Noite")).toBeInTheDocument();
    expect(screen.queryByText("Vestido Midi Charm")).not.toBeInTheDocument();
  });

  it("filtra vestidos por categoria via tags mesmo com categories vazio", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [
        { ...catalog[0], idProduto: 1, titulo: "Vestido Rosa Clássico", descricao: "Modelo festa", categories: [], tags: ["festa"] },
        { ...catalog[1], idProduto: 2, titulo: "Vestido Azul Dia", descricao: "Modelo casual para o dia a dia", categories: [], tags: ["casual"] },
      ],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });

    renderWithProviders(<ProdutosPage />, { route: "/produtos?categoria=festa" });
    await screen.findByText("Vestido Rosa Clássico");

    expect(screen.getByText("Vestido Rosa Clássico")).toBeInTheDocument();
    expect(screen.queryByText("Vestido Azul Dia")).not.toBeInTheDocument();
  });
});
