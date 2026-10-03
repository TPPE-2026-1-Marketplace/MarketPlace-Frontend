import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import Footer from "./Footer";

describe("Footer", () => {
  it("lista coleções, atendimento e contatos da loja", () => {
    renderWithProviders(<Footer />);

    expect(screen.getByRole("link", { name: "Debutante" })).toHaveAttribute("href", "/produtos?categoria=debutante");
    expect(screen.getByRole("link", { name: "Longuete" })).toHaveAttribute("href", "/produtos?tipo=longuete");
    expect(screen.getByRole("link", { name: "Trocas e Devoluções" })).toHaveAttribute("href", "/politicas");
    expect(screen.getByText("(61) 9 9685-6892")).toBeInTheDocument();
    expect(screen.getByTitle("Falar no WhatsApp")).toHaveAttribute("href", expect.stringContaining("5561996856892"));
  });
});
