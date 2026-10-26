import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchProducts } from "@/lib/catalog";
import { makeProduct, makeVariant } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import Home from "@/pages/page";
import CategorySection from "./CategorySection";
import FeaturedProducts from "./FeaturedProducts";
import GuidanceSection from "./GuidanceSection";
import HeroSection from "./HeroSection";

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  fetchProducts: vi.fn(),
}));
const fetchMock = vi.mocked(fetchProducts);
const meta = { page: 1, limit: 4, total: 2, totalPages: 1 };

beforeEach(() => {
  fetchMock.mockResolvedValue({
    data: [
      makeProduct(),
      makeProduct({ idProduto: 2, titulo: "Vestido Sem Foto", categories: [], variants: [makeVariant({ images: [] })] }),
    ],
    meta,
  });
});

describe("HeroSection", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra o primeiro banner ativo com os links das categorias", () => {
    renderWithProviders(<HeroSection />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Elegância que transforma cada momento");
    expect(screen.getByRole("link", { name: "Ver Coleção" })).toHaveAttribute("href", "/produtos");
    expect(screen.getByRole("link", { name: "Debutante" })).toHaveAttribute("href", "/produtos?categoria=debutante");
    expect(screen.getByText("01 / 03")).toBeInTheDocument();
  });

  it("navega pelos slides com as setas, os pontos e o temporizador", () => {
    vi.useFakeTimers();
    renderWithProviders(<HeroSection />);
    const buttons = screen.getAllByRole("button");
    const [, , dot3, prev, next] = buttons;

    fireEvent.click(prev);
    expect(screen.getByText("03 / 03")).toBeInTheDocument();
    fireEvent.click(next);
    expect(screen.getByText("01 / 03")).toBeInTheDocument();
    fireEvent.click(next);
    expect(screen.getByText("02 / 03")).toBeInTheDocument();
    fireEvent.click(prev);
    expect(screen.getByText("01 / 03")).toBeInTheDocument();

    fireEvent.click(dot3);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Vestidos que contam histórias");
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByText("01 / 03")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByText("02 / 03")).toBeInTheDocument();
  });
});

describe("seções estáticas", () => {
  it("CategorySection linka cada coleção", () => {
    renderWithProviders(<CategorySection />);
    expect(screen.getByText("Encontre o vestido para o seu momento")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Casamento/ })).toHaveAttribute("href", "/produtos?categoria=casamento");
  });

  it("GuidanceSection mostra os passos de como comprar", () => {
    renderWithProviders(<GuidanceSection />);
    expect(screen.getByText("Seu vestido, com mais confiança")).toBeInTheDocument();
    expect(screen.getByText("Confira antes de comprar")).toBeInTheDocument();
  });
});

describe("FeaturedProducts", () => {
  it("mostra o carregamento e depois os produtos em destaque", async () => {
    const { container } = renderWithProviders(<FeaturedProducts />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);

    expect(await screen.findByText("Vestido Rosa Encanto")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith({ page: 1, limit: 4 });
    expect(screen.getByAltText("Vestido Sem Foto")).toHaveAttribute("src", "/hero-dress.png");
    expect(screen.getByRole("link", { name: "Ver todos os vestidos" })).toHaveAttribute("href", "/produtos");
  });

  it("mostra o estado vazio quando não há produtos em destaque", async () => {
    fetchMock.mockResolvedValue({ data: [], meta: { page: 1, limit: 4, total: 0, totalPages: 0 } });
    renderWithProviders(<FeaturedProducts />);
    expect(await screen.findByText("Nenhum vestido em destaque")).toBeInTheDocument();
  });
});

describe("Home", () => {
  it("monta todas as seções da página inicial", async () => {
    renderWithProviders(<Home />);

    expect(screen.getByLabelText("Banner principal")).toBeInTheDocument();
    expect(screen.getByText("Encontre o vestido para o seu momento")).toBeInTheDocument();
    expect(screen.getByText("Seu vestido, com mais confiança")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Vestido Rosa Encanto")).toBeInTheDocument());
  });
});
