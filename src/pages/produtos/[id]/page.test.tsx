import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { fetchProduct, fetchProducts } from "@/lib/catalog";
import { makeProduct, makeVariant } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import ProductDetailPage from "./page";

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  fetchProduct: vi.fn(),
  fetchProducts: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { post: vi.fn() },
}));

const img = (id: number) => ({ idImagem: id, url: `/img-${id}.jpg`, ordem: id, descricao: null });

const vestido = makeProduct({
  idProduto: 7,
  titulo: "Vestido Gala",
  precoBase: 1000,
  descricao: "Longo bordado",
  variants: [
    makeVariant({ codigoSku: "ROSA-38", cor: "Rosa", tamanho: "38", precoVariante: 800, images: [img(1), img(2)], stock: { qtdOnline: 2, qtdLojaFisica: 1 } }),
    makeVariant({ codigoSku: "ROSA-40", cor: "Rosa", tamanho: "40", precoVariante: 800, images: [img(3)], stock: { qtdOnline: 0, qtdLojaFisica: 0 } }),
    makeVariant({ codigoSku: "AZUL-42", cor: "Azul", tamanho: "42", precoVariante: 1000, images: [], stock: { qtdOnline: 10, qtdLojaFisica: 0 } }),
    makeVariant({ codigoSku: "VERDE-38", cor: "Verde", tamanho: "38", ativo: false }),
  ],
});

async function renderProduct(product = vestido) {
  vi.mocked(fetchProduct).mockResolvedValueOnce(product);
  renderWithProviders(<ProductDetailPage />, { route: `/produtos/${product.idProduto}`, path: "/produtos/:id" });
  await screen.findByTestId("product-detail");
}

const mainImage = () => screen.getAllByAltText("Vestido Gala")[0];
const cart = () => JSON.parse(localStorage.getItem("cart") ?? '{"items":[]}');

describe("ProductDetailPage", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [vestido, makeProduct({ idProduto: 8, titulo: "Relacionado" })],
      meta: { page: 1, limit: 4, total: 2, totalPages: 1 },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra o carregamento e depois o produto com desconto e estoque baixo", async () => {
    vi.mocked(fetchProduct).mockResolvedValueOnce(vestido);
    renderWithProviders(<ProductDetailPage />, { route: "/produtos/7", path: "/produtos/:id" });
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    await screen.findByTestId("product-detail");
    expect(fetchProduct).toHaveBeenCalledWith(7);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Vestido Gala");
    expect(screen.getAllByText("-20%")).toHaveLength(2);
    expect(screen.getByText("Últimas unidades")).toBeInTheDocument();
    expect(screen.getByText("2 disponível online")).toBeInTheDocument();
    expect(screen.getByText("Longo bordado")).toBeInTheDocument();
    expect(screen.getByText("Relacionado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Verde" })).not.toBeInTheDocument();
  });

  it("mostra a página de não encontrado quando a API falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchProduct).mockRejectedValueOnce(new Error("404"));
    renderWithProviders(<ProductDetailPage />, { route: "/produtos/99", path: "/produtos/:id" });

    expect(await screen.findByRole("link", { name: "Voltar para a loja" })).toHaveAttribute("href", "/produtos");
  });

  it("troca cor e tamanho mantendo uma variante válida", async () => {
    await renderProduct();

    await userEvent.click(screen.getByRole("button", { name: "Azul" }));
    expect(screen.getByText("10 disponível online")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "38" })).not.toBeInTheDocument();
    expect(mainImage()).toHaveAttribute("src", "/hero-dress.png");
    expect(screen.queryByText("-20%")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Rosa" }));
    await userEvent.click(screen.getByRole("button", { name: "40" }));
    expect(screen.getByText("0 disponível online")).toBeInTheDocument();
    expect(mainImage()).toHaveAttribute("src", "/img-3.jpg");
  });

  it("navega pela galeria", async () => {
    await renderProduct();
    const [prev, next] = Array.from(mainImage().parentElement!.querySelectorAll("button")).slice(1);

    fireEvent.click(next);
    expect(mainImage()).toHaveAttribute("src", "/img-2.jpg");
    fireEvent.click(next);
    expect(mainImage()).toHaveAttribute("src", "/img-1.jpg");
    fireEvent.click(prev);
    expect(mainImage()).toHaveAttribute("src", "/img-2.jpg");
    // Miniatura (desktop e mobile repetem as mesmas imagens).
    fireEvent.click(screen.getAllByAltText("Vestido Gala 1")[0]);
    expect(mainImage()).toHaveAttribute("src", "/img-1.jpg");
  });

  it("limita a quantidade ao estoque online e adiciona ao carrinho", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderProduct();
    const quantity = screen.getByText("Quantidade:").nextElementSibling!;
    const [minus, plus] = Array.from(quantity.querySelectorAll("button"));

    await userEvent.click(minus);
    await userEvent.click(plus);
    await userEvent.click(plus);
    await userEvent.click(plus);
    expect(quantity).toHaveTextContent("2");

    await userEvent.click(screen.getByTestId("add-to-cart"));
    expect(screen.getByText("Adicionado!")).toBeInTheDocument();
    expect(cart().items[0]).toMatchObject({ quantity: 2, variant: { codigoSku: "ROSA-38", produto: { idProduto: 7 } } });
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText("Adicionado!")).not.toBeInTheDocument();
  });

  it("compra agora e vai para o carrinho", async () => {
    await renderProduct();

    await userEvent.click(screen.getByRole("button", { name: "Comprar Agora" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/carrinho");
    expect(cart().items).toHaveLength(1);
  });

  it("avisa quando o produto não tem variantes", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    await renderProduct(makeProduct({ idProduto: 7, titulo: "Vestido Gala", variants: [] }));

    await userEvent.click(screen.getByTestId("add-to-cart"));
    await userEvent.click(screen.getByRole("button", { name: "Comprar Agora" }));

    expect(alert).toHaveBeenCalledTimes(2);
    expect(cart().items).toHaveLength(0);
  });

  it("simula o frete pelo CEP", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ valor: 30, prazo_dias: 1 })
      .mockRejectedValueOnce(new Error("Fora da área"))
      .mockRejectedValueOnce("falha");
    await renderProduct();
    const cep = screen.getByPlaceholderText("Digite seu CEP");
    const ok = screen.getByRole("button", { name: "OK" });

    await userEvent.type(cep, "123");
    await userEvent.click(ok);
    expect(screen.getByText("CEP inválido. Use 8 dígitos.")).toBeInTheDocument();

    await userEvent.clear(cep);
    await userEvent.type(cep, "70000000");
    await userEvent.click(ok);
    expect(await screen.findByText(/prazo de 1 dia/)).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/shipping/calculate", { cep_destino: "70000000" });

    await userEvent.click(ok);
    expect(await screen.findByText("Fora da área")).toBeInTheDocument();
    await userEvent.click(ok);
    expect(await screen.findByText("Erro ao calcular frete.")).toBeInTheDocument();
  });

  it("mostra as abas de medidas e informações e o guia em modal", async () => {
    await renderProduct();

    await userEvent.click(screen.getByRole("button", { name: "Guia de Medidas" }));
    expect(screen.getAllByRole("row").map((r) => r.firstChild?.textContent)).toEqual(["Tam.", "38", "40"]);
    await userEvent.click(screen.getByRole("button", { name: "Informações" }));
    expect(screen.queryByText("Busto (cm)")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Ver medidas/ }));
    expect(screen.getByRole("heading", { name: "Guia de Medidas" })).toBeInTheDocument();
    const close = screen.getByRole("heading", { name: "Guia de Medidas" }).nextElementSibling as HTMLElement;
    await userEvent.click(close);
    expect(screen.queryByRole("heading", { name: "Guia de Medidas" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Voltar/ }));
  });
});
