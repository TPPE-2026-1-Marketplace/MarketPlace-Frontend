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
    expect(screen.getByRole("link", { name: "Formatura" })).toHaveClass("bg-[#1a1a1a]");
  });

  it("filtra pela categoria da URL e marca o comprimento da URL", async () => {
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [
        { ...catalog[0], categories: [{ idCategoria: 2, nome: "Festa" }] },
        { ...catalog[1], categories: [{ idCategoria: 2, nome: "Festa" }] },
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
    const select = screen.getByRole("combobox");

    await userEvent.selectOptions(select, "menor-preco");
    expect(titles()).toEqual(["Vestido Rosa", "Vestido Preto", "Vestido Azul"]);

    await userEvent.selectOptions(select, "maior-preco");
    expect(titles()).toEqual(["Vestido Azul", "Vestido Preto", "Vestido Rosa"]);

    await userEvent.selectOptions(select, "novidade");
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

    const aside = document.querySelector("aside")!;
    expect(aside).toHaveClass("hidden");
    await userEvent.click(toggle);
    expect(aside).toHaveClass("block");
  });
});
