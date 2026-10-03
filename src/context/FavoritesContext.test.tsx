import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { FavoritesProvider, useFavorites } from "./FavoritesContext";

const wrapper = ({ children }: { children: ReactNode }) => <FavoritesProvider>{children}</FavoritesProvider>;

describe("FavoritesContext", () => {
  it("exige o FavoritesProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useFavorites())).toThrow(
      "useFavorites must be used within FavoritesProvider",
    );
  });

  it("alterna favoritos e persiste no localStorage", () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => result.current.toggleFavorite("1"));
    act(() => result.current.toggleFavorite("2"));
    expect(result.current.favorites).toEqual(["1", "2"]);
    expect(result.current.isFavorite("1")).toBe(true);
    expect(result.current.count).toBe(2);

    act(() => result.current.toggleFavorite("1"));
    expect(result.current.isFavorite("1")).toBe(false);
    expect(JSON.parse(localStorage.getItem("dk_favorites") ?? "[]")).toEqual(["2"]);
  });

  it("restaura favoritos salvos e ignora dados inválidos", () => {
    localStorage.setItem("dk_favorites", JSON.stringify(["7"]));
    expect(renderHook(() => useFavorites(), { wrapper }).result.current.favorites).toEqual(["7"]);

    localStorage.setItem("dk_favorites", JSON.stringify({ id: "7" }));
    expect(renderHook(() => useFavorites(), { wrapper }).result.current.favorites).toEqual([]);

    localStorage.setItem("dk_favorites", "{quebrado");
    expect(renderHook(() => useFavorites(), { wrapper }).result.current.favorites).toEqual([]);
  });
});
