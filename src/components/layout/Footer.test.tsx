import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import Footer from "./Footer";

describe("Footer", () => {
  it("leva às políticas da loja e ao atendimento pelo WhatsApp", () => {
    renderWithProviders(<Footer />);

    expect(screen.getByText("DK Fashion")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trocas e devoluções" })).toHaveAttribute("href", "/politicas#trocas");
    expect(screen.getByRole("link", { name: "Políticas" })).toHaveAttribute("href", "/politicas");
    expect(screen.getByRole("link", { name: "Atendimento" })).toHaveAttribute("href", expect.stringContaining("5561996856892"));
    expect(screen.getByTitle("Falar no WhatsApp")).toHaveAttribute("href", expect.stringContaining("5561996856892"));
  });
});
