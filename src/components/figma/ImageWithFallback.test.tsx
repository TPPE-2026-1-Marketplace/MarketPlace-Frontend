import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImageWithFallback } from "./ImageWithFallback";

describe("ImageWithFallback", () => {
  it("mostra a imagem original e troca pelo placeholder quando falha", () => {
    render(<ImageWithFallback src="/foto.jpg" alt="Vestido" className="w-10" />);

    const img = screen.getByAltText("Vestido");
    expect(img).toHaveAttribute("src", "/foto.jpg");

    fireEvent.error(img);

    const fallback = screen.getByAltText("Error loading image");
    expect(fallback).toHaveAttribute("data-original-url", "/foto.jpg");
    expect(fallback.parentElement?.parentElement).toHaveClass("w-10");
  });
});
