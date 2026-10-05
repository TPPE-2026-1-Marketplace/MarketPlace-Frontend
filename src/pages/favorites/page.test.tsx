import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchProducts } from "@/lib/catalog";
import { makeProduct, makeVariant } from "@/test/factories";
import { customer, renderWithProviders } from "@/test/render";
import FavoritesPage from "./page";

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  fetchProducts: vi.fn(),
}));

describe("FavoritesPage", () => {
  beforeEach(() => {
    vi.mocked(fetchProducts).mockResolvedValue({
      data: [
        makeProduct({ idProduto: 1, titulo: "Vestido Favorito" }),
        makeProduct({ idProduto: 2, titulo: "Vestido Comum" }),
        makeProduct({ idProduto: 3, titulo: "Vestido Sem Imagem", categories: [], variants: [makeVariant({ images: [] })] }),
      ],
      meta: { page: 1, limit: 100, total: 3, totalPages: 1 },
    });
  });

  it("pede login para visitantes", () => {
    renderWithProviders(<FavoritesPage />);

    expect(screen.getByText("Você precisa estar logada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fazer Login" })).toHaveAttribute("href", "/login");
  });

  it("mostra estado vazio quando não há favoritos", async () => {
    renderWithProviders(<FavoritesPage />, { user: customer });

    expect(await screen.findByText("Nenhum favorito ainda")).toBeInTheDocument();
    expect(screen.getByText("0 vestidos salvos")).toBeInTheDocument();
  });

  it("lista só os produtos favoritados", async () => {
    localStorage.setItem("dk_favorites", JSON.stringify(["1"]));
    const { container } = renderWithProviders(<FavoritesPage />, { user: customer });
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(4);

    expect(await screen.findByText("Vestido Favorito")).toBeInTheDocument();
    expect(screen.queryByText("Vestido Comum")).not.toBeInTheDocument();
    expect(screen.getByText("1 vestido salvos")).toBeInTheDocument();
  });

  it("usa imagem padrão para favorito sem foto", async () => {
    localStorage.setItem("dk_favorites", JSON.stringify(["1", "3"]));
    renderWithProviders(<FavoritesPage />, { user: customer });

    expect(await screen.findByAltText("Vestido Sem Imagem")).toHaveAttribute("src", "/hero-dress.png");
    expect(screen.getByText("2 vestidos salvos")).toBeInTheDocument();
  });
});
