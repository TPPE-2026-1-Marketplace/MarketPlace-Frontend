import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductReviewsSection } from "./ProductReviewsSection";

const distribution = { "1": 0, "2": 1, "3": 0, "4": 1, "5": 2 };

const reviews = [
  { idProduto: 7, nota: 5, comentario: "Perfeito!", dataAvaliacao: "2026-10-01T12:00:00Z", dataEdicao: null, cliente: { nome: "Ana" } },
  { idProduto: 7, nota: 2, comentario: "Apertado.", dataAvaliacao: "2026-10-02T12:00:00Z", dataEdicao: "2026-10-03T12:00:00Z", cliente: { nome: "Bia" } },
];

function renderSection(props: Partial<React.ComponentProps<typeof ProductReviewsSection>> = {}) {
  return render(
    <ProductReviewsSection reviews={reviews} averageRating={4.25} totalReviews={4} distribution={distribution} {...props} />,
  );
}

describe("ProductReviewsSection", () => {
  it("mostra a nota média e o total", () => {
    renderSection();

    expect(screen.getByText("Avaliações dos clientes (4)")).toBeInTheDocument();
    expect(screen.getByText("4,3")).toBeInTheDocument();
    expect(screen.getByText("de 5 · 4 avaliações")).toBeInTheDocument();
  });

  it("mostra a distribuição das notas com a contagem de cada uma", () => {
    renderSection();

    const lista = screen.getByRole("list", { name: "Distribuição das notas" });
    const linhas = within(lista).getAllByRole("listitem");
    expect(linhas).toHaveLength(5);
    expect(linhas[0]).toHaveTextContent("5 estrelas");
    expect(linhas[0]).toHaveTextContent("2");
    expect(linhas[4]).toHaveTextContent("1 estrela");
    expect(linhas[4]).toHaveTextContent("0");
    // 2 de 4 avaliações = 50%
    expect(linhas[0].querySelector("[style]")).toHaveStyle({ width: "50%" });
  });

  it("marca como editada só a avaliação que tem data de edição", () => {
    renderSection();

    expect(screen.getAllByText(/editada/)).toHaveLength(1);
    const bia = screen.getByText("Bia").closest("div")!.parentElement!;
    expect(bia).toHaveTextContent("editada");
    const ana = screen.getByText("Ana").closest("div")!.parentElement!;
    expect(ana).not.toHaveTextContent("editada");
  });

  it("oferece 'Ver mais avaliações' quando há mais páginas", async () => {
    const onLoadMore = vi.fn();
    renderSection({ hasMore: true, onLoadMore });

    await userEvent.click(screen.getByRole("button", { name: "Ver mais avaliações" }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("desabilita o botão enquanto carrega mais e esconde quando não há mais páginas", () => {
    const { rerender } = renderSection({ hasMore: true, isLoadingMore: true, onLoadMore: vi.fn() });
    expect(screen.getByRole("button", { name: "Carregando..." })).toBeDisabled();

    rerender(
      <ProductReviewsSection reviews={reviews} averageRating={4.25} totalReviews={4} hasMore={false} onLoadMore={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: /mais avaliações/ })).not.toBeInTheDocument();
  });

  it("mostra o estado vazio quando não há avaliações", () => {
    renderSection({ reviews: [], totalReviews: 0, averageRating: 0, distribution: undefined });

    expect(screen.getByText("Este produto ainda não possui avaliações.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma nota ainda")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Distribuição das notas" })).not.toBeInTheDocument();
  });

  it("mostra o carregamento", () => {
    renderSection({ isLoading: true });

    expect(screen.getByText("Carregando avaliações...")).toBeInTheDocument();
    expect(screen.queryByText("Perfeito!")).not.toBeInTheDocument();
  });

  it("mostra o erro e permite tentar de novo", async () => {
    const onRetry = vi.fn();
    renderSection({ error: "Não foi possível carregar as avaliações.", onRetry });

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar as avaliações.");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
