import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./context/AuthContext";
import { BannerProvider } from "./context/BannerContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { POSProvider } from "./context/POSContext";
import { CartProvider } from "./hooks/useCart";
import { fetchProducts } from "./lib/catalog";
import App from "./App";

vi.mock("./lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./lib/catalog")>()),
  fetchProducts: vi.fn(),
}));

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(
    <AuthProvider>
      <BannerProvider>
        <POSProvider>
          <FavoritesProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </FavoritesProvider>
        </POSProvider>
      </BannerProvider>
    </AuthProvider>,
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.mocked(fetchProducts).mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  });

  it("renderiza a loja com cabeçalho e rodapé na rota inicial", async () => {
    renderAt("/");

    expect(screen.getByLabelText("Banner principal")).toBeInTheDocument();
    expect(screen.getByTestId("cart-link")).toBeInTheDocument();
    expect(screen.getByText("© 2026 DK Fashion. Todos os direitos reservados.")).toBeInTheDocument();
    await screen.findByText("Destaques");
  });

  it("rota de favoritos usa o layout da loja", () => {
    renderAt("/favoritos");
    expect(screen.getByText("Você precisa estar logada")).toBeInTheDocument();
    expect(screen.getByTestId("cart-link")).toBeInTheDocument();
  });

  it("painel fica fora do layout da loja", () => {
    renderAt("/painel");
    expect(screen.getByText("Acesso Restrito")).toBeInTheDocument();
    expect(screen.queryByTestId("cart-link")).not.toBeInTheDocument();
  });
});
