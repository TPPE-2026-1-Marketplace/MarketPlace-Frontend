import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { createReview, fetchMyReviewStatus, fetchProduct, fetchProducts, getProductReviews } from "@/lib/catalog";
import { makeProduct, makeVariant } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import ProductDetailPage from "./page";

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  fetchProduct: vi.fn(),
  fetchProducts: vi.fn(),
  getProductReviews: vi.fn(),
  fetchMyReviewStatus: vi.fn(),
  createReview: vi.fn(),
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
  material: "Chiffon Nobre",
  composicao: "100% Seda",
  silhueta: "Princesa",
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
    vi.mocked(getProductReviews).mockResolvedValue({
      data: [
        {
          idProduto: 7,
          nota: 5,
          comentario: "Vestido maravilhoso!",
          dataAvaliacao: "2026-03-10T12:00:00Z",
          cliente: { nome: "Mariana L." },
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      media: 4.8,
      totalAvaliacoes: 327,
      distribuicao: { "1": 0, "2": 0, "3": 0, "4": 15, "5": 312 },
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
    expect(screen.getByText("Chiffon Nobre")).toBeInTheDocument();
    expect(screen.getByText("100% Seda")).toBeInTheDocument();
    expect(screen.getByText("Princesa")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Ver medidas/ }));
    expect(screen.getByRole("heading", { name: "Guia de Medidas" })).toBeInTheDocument();
    const close = screen.getByRole("heading", { name: "Guia de Medidas" }).nextElementSibling as HTMLElement;
    await userEvent.click(close);
    expect(screen.queryByRole("heading", { name: "Guia de Medidas" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Voltar/ }));
  });

  it("abre o modal de foto ampliada, alterna zoom e navega pelas imagens", async () => {
    await renderProduct();

    await userEvent.click(screen.getByRole("button", { name: /Toque na imagem para ampliar/i }));
    expect(screen.getByRole("dialog", { name: /Foto ampliada de Vestido Gala/i })).toBeInTheDocument();

    const zoomToggle = screen.getByRole("button", { name: /Ativar zoom 2.5x/i });
    expect(zoomToggle).toBeInTheDocument();
    await userEvent.click(zoomToggle);
    expect(screen.getByRole("button", { name: /Desativar zoom/i })).toBeInTheDocument();

    const nextModalBtn = screen.getByRole("button", { name: "Próxima foto" });
    await userEvent.click(nextModalBtn);

    await userEvent.click(screen.getByRole("button", { name: "Fechar imagem" }));
    expect(screen.queryByRole("dialog", { name: /Foto ampliada de Vestido Gala/i })).not.toBeInTheDocument();
  });

  it("convida a entrar para avaliar quando não há login", async () => {
    await renderProduct();

    expect(screen.getByRole("link", { name: "Entre na sua conta" })).toHaveAttribute("href", "/login");
    expect(fetchMyReviewStatus).not.toHaveBeenCalled();
  });

  it("depois de publicar a avaliação, a lista e a nota média da página são recarregadas", async () => {
    vi.mocked(fetchProduct).mockResolvedValueOnce(vestido);
    vi.mocked(fetchMyReviewStatus)
      .mockResolvedValueOnce({ avaliacao: null, podeAvaliar: true, motivo: "PODE_AVALIAR" })
      .mockResolvedValue({
        avaliacao: { idProduto: 7, nota: 5, comentario: "Amei", dataAvaliacao: "2026-10-05T12:00:00Z", dataEdicao: null },
        podeAvaliar: false,
        motivo: "JA_AVALIOU",
      });
    vi.mocked(createReview).mockResolvedValueOnce(undefined);
    vi.mocked(getProductReviews).mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      media: 0,
      totalAvaliacoes: 0,
      distribuicao: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    });
    vi.mocked(getProductReviews).mockResolvedValueOnce({
      data: [
        { idProduto: 7, nota: 5, comentario: "Amei", dataAvaliacao: "2026-10-05T12:00:00Z", cliente: { nome: "Mariana L." } },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      media: 5,
      totalAvaliacoes: 1,
      distribuicao: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 1 },
    });
    renderWithProviders(<ProductDetailPage />, {
      route: "/produtos/7",
      path: "/produtos/:id",
      user: { id: "11144477735", name: "Mariana Lima", email: "mariana@email.com", role: "customer" },
    });
    await screen.findByTestId("product-detail");
    expect(await screen.findByText("Este produto ainda não possui avaliações.")).toBeInTheDocument();

    await userEvent.click(await screen.findByRole("radio", { name: /^5 estrelas/ }));
    await userEvent.type(screen.getByLabelText(/Comentário/), "Amei");
    await userEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));

    expect(createReview).toHaveBeenCalledWith(7, { nota: 5, comentario: "Amei" });
    expect(await screen.findByText("Avaliações dos clientes (1)")).toBeInTheDocument();
    expect(screen.getAllByText("Amei").length).toBeGreaterThan(0);
    expect(screen.getByText("de 5 · 1 avaliações")).toBeInTheDocument();
  });

  it("exibe avaliações e nota média carregadas via API", async () => {
    await renderProduct();

    expect(screen.getByText("Mariana L.")).toBeInTheDocument();
    expect(screen.getByText("Vestido maravilhoso!")).toBeInTheDocument();
    expect(screen.getByText("Avaliações dos clientes (327)")).toBeInTheDocument();
  });

  it("busca produtos relacionados filtrando pela categoria do produto", async () => {
    await renderProduct();

    expect(fetchProducts).toHaveBeenCalledWith({
      page: 1,
      limit: 5,
      categoryId: 1,
    });
  });

  it("desabilita compra para produto de tamanho unico sem cor com estoque zerado", async () => {
    await renderProduct(
      makeProduct({
        idProduto: 99,
        titulo: "Vestido Tamanho Unico Esgotado",
        variants: [
          makeVariant({
            codigoSku: "UNICO-ZERO",
            cor: null,
            tamanho: null,
            ativo: true,
            stock: { qtdOnline: 0, qtdLojaFisica: 0 },
          }),
        ],
      }),
    );

    expect(screen.getByRole("button", { name: "Comprar Agora" })).toBeDisabled();
    expect(screen.getByTestId("add-to-cart")).toBeDisabled();
    expect(screen.getByText("0 disponível online")).toBeInTheDocument();
  });

  it("desabilita compra quando todas as variantes estao inativas", async () => {
    await renderProduct(
      makeProduct({
        idProduto: 98,
        titulo: "Vestido Variantes Inativas",
        variants: [
          makeVariant({
            codigoSku: "INATIVO-1",
            cor: "Azul",
            tamanho: "38",
            ativo: false,
            stock: { qtdOnline: 10, qtdLojaFisica: 0 },
          }),
        ],
      }),
    );

    expect(screen.getByRole("button", { name: "Comprar Agora" })).toBeDisabled();
    expect(screen.getByTestId("add-to-cart")).toBeDisabled();
  });

  it("exibe tamanhos numericos plus size (48 a 58) no guia de medidas quando presentes no produto", async () => {
    await renderProduct(
      makeProduct({
        idProduto: 97,
        titulo: "Vestido Plus Size",
        variants: [
          makeVariant({
            codigoSku: "PLUS-48",
            tamanho: "48",
            ativo: true,
            stock: { qtdOnline: 5, qtdLojaFisica: 0 },
          }),
          makeVariant({
            codigoSku: "PLUS-50",
            tamanho: "50",
            ativo: true,
            stock: { qtdOnline: 5, qtdLojaFisica: 0 },
          }),
        ],
      }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Guia de Medidas" }));
    expect(screen.getAllByRole("row").map((r) => r.firstChild?.textContent)).toEqual(["Tam.", "48", "50"]);
  });

  it("marca cor como indisponivel quando todas as suas variantes ativas estao com estoque zerado", async () => {
    await renderProduct(
      makeProduct({
        idProduto: 96,
        titulo: "Vestido Cores",
        variants: [
          makeVariant({
            codigoSku: "AZUL-DISP",
            cor: "Azul",
            tamanho: "38",
            ativo: true,
            stock: { qtdOnline: 5, qtdLojaFisica: 0 },
          }),
          makeVariant({
            codigoSku: "VERMELHO-ESGOTADO",
            cor: "Vermelho",
            tamanho: "38",
            ativo: true,
            stock: { qtdOnline: 0, qtdLojaFisica: 0 },
          }),
        ],
      }),
    );

    const redButton = screen.getByRole("button", { name: "Vermelho" });
    expect(redButton).toBeDisabled();
    expect(redButton).toHaveClass("cursor-not-allowed");

    const blueButton = screen.getByRole("button", { name: "Azul" });
    expect(blueButton).not.toBeDisabled();
  });

  it("exibe badge de compra verificada apenas quando compraVerificada for true", async () => {
    vi.mocked(getProductReviews).mockResolvedValueOnce({
      data: [
        {
          idProduto: 7,
          nota: 5,
          comentario: "Avaliação normal",
          dataAvaliacao: "2026-03-10T12:00:00Z",
          cliente: { nome: "Cliente 1" },
          compraVerificada: false,
        },
        {
          idProduto: 7,
          nota: 4,
          comentario: "Avaliação verificada",
          dataAvaliacao: "2026-03-11T12:00:00Z",
          cliente: { nome: "Cliente 2" },
          compraVerificada: true,
        },
      ],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      media: 4.5,
      totalAvaliacoes: 2,
      distribuicao: { "1": 0, "2": 0, "3": 0, "4": 1, "5": 1 },
    });

    await renderProduct();

    expect(screen.getByText("Cliente 1")).toBeInTheDocument();
    expect(screen.getByText("Cliente 2")).toBeInTheDocument();
    expect(screen.getAllByText("Compra verificada")).toHaveLength(1);
  });

  it("alinha estado desabilitado da barra mobile com a variante ativa inativa", async () => {
    await renderProduct(
      makeProduct({
        idProduto: 95,
        titulo: "Vestido Variante Inativa Com Estoque",
        variants: [
          makeVariant({
            codigoSku: "INATIVA-COM-ESTOQUE",
            cor: "Azul",
            tamanho: "38",
            ativo: false,
            stock: { qtdOnline: 10, qtdLojaFisica: 0 },
          }),
        ],
      }),
    );

    const mobileButtons = screen.getAllByRole("button", { name: "Esgotado" });
    expect(mobileButtons.length).toBeGreaterThanOrEqual(1);
    expect(mobileButtons[mobileButtons.length - 1]).toBeDisabled();
  });
});
