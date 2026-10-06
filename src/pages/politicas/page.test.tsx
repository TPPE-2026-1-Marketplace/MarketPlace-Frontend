import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import PoliticasPage from "./page";

describe("PoliticasPage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra todas as seções de políticas", () => {
    renderWithProviders(<PoliticasPage />);

    for (const id of ["entrega", "trocas", "pagamento", "lgpd", "contato"]) {
      expect(document.getElementById(id)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("link", { name: /Proteção de Dados/ }).length).toBeGreaterThan(0);
  });

  it("rola até a seção indicada no hash da URL", () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderWithProviders(<PoliticasPage />, { route: "/politicas#lgpd" });
    act(() => vi.advanceTimersByTime(100));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });
});
