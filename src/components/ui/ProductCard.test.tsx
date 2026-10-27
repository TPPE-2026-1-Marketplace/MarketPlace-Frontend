import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeVariant } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import ProductCard from "./ProductCard";

function renderCard(props: Partial<React.ComponentProps<typeof ProductCard>> = {}) {
  return renderWithProviders(
    <ProductCard id={1} titulo="Vestido Rosa" preco={300} imagem="/rosa.jpg" variant={makeVariant()} {...props} />,
  );
}

describe("ProductCard: avaliações", () => {
  it("mostra a nota e o total quando o produto tem avaliações", () => {
    renderCard({ nota: 4.5, totalAvaliacoes: 12 });

    const avaliacao = screen.getByLabelText("Nota 4,5 de 5, 12 avaliações");
    expect(avaliacao).toHaveTextContent("4,5 (12)");
  });

  it("usa o singular com uma única avaliação", () => {
    renderCard({ nota: 5, totalAvaliacoes: 1 });

    expect(screen.getByLabelText("Nota 5,0 de 5, 1 avaliação")).toBeInTheDocument();
  });

  it("preenche as estrelas pela nota arredondada", () => {
    renderCard({ nota: 3.6, totalAvaliacoes: 5 });

    const estrelas = Array.from(document.querySelectorAll("svg[data-filled]"));
    expect(estrelas.map((s) => s.getAttribute("data-filled"))).toEqual(["true", "true", "true", "true", "false"]);
  });

  it("não mostra a linha de avaliação sem avaliações", () => {
    renderCard({ nota: 0, totalAvaliacoes: 0 });

    expect(screen.queryByLabelText(/^Nota /)).not.toBeInTheDocument();
  });

  it("não mostra a linha de avaliação quando a nota não é informada", () => {
    renderCard();

    expect(screen.queryByLabelText(/^Nota /)).not.toBeInTheDocument();
  });
});
