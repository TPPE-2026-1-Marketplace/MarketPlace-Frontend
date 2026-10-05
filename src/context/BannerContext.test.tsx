import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { BannerProvider, CATEGORY_OPTIONS, categoryToPath, useBanners } from "./BannerContext";

const wrapper = ({ children }: { children: ReactNode }) => <BannerProvider>{children}</BannerProvider>;
const ids = (banners: { id: string }[]) => banners.map((b) => b.id);

describe("categoryToPath", () => {
  it("monta a rota de cada tipo de categoria", () => {
    expect(categoryToPath("all")).toBe("/produtos");
    expect(categoryToPath("midi")).toBe("/produtos?tipo=midi");
    expect(categoryToPath("longuete")).toBe("/produtos?tipo=longuete");
    expect(categoryToPath("festa")).toBe("/produtos?categoria=festa");
  });

  it("todas as opções de categoria têm valor único", () => {
    const values = CATEGORY_OPTIONS.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("BannerContext", () => {
  it("exige o BannerProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useBanners())).toThrow("useBanners must be used within BannerProvider");
  });

  it("lista os banners iniciais ordenados e ativos", () => {
    const { result } = renderHook(() => useBanners(), { wrapper });

    expect(ids(result.current.banners)).toEqual(["b-001", "b-002", "b-003"]);
    expect(ids(result.current.activeBanners)).toEqual(["b-001", "b-002", "b-003"]);
  });

  it("adiciona, edita, ativa/desativa e remove banners", () => {
    const { result } = renderHook(() => useBanners(), { wrapper });
    const base = result.current.banners[0];

    act(() => result.current.addBanner({ ...base, title: "Novo", active: true }));
    const novo = result.current.banners[3];
    expect(novo).toMatchObject({ title: "Novo", order: 4 });

    act(() => result.current.updateBanner(novo.id, { title: "Editado" }));
    expect(result.current.banners[3].title).toBe("Editado");

    act(() => result.current.toggleActive(novo.id));
    expect(ids(result.current.activeBanners)).not.toContain(novo.id);

    act(() => result.current.deleteBanner(novo.id));
    expect(result.current.banners).toHaveLength(3);
  });

  it("começa a ordem em 1 quando não há banners", () => {
    const { result } = renderHook(() => useBanners(), { wrapper });
    act(() => ["b-001", "b-002", "b-003"].forEach((id) => result.current.deleteBanner(id)));

    act(() => result.current.addBanner({ ...{ image: "", tag: "", title: "Único", subtitle: "" }, primaryCta: "", primaryCategory: "all", secondaryCta: "", secondaryCategory: "all", active: false }));

    expect(result.current.banners[0].order).toBe(1);
    expect(result.current.activeBanners).toEqual([]);
  });

  it("move banners para cima e para baixo respeitando os limites", () => {
    const { result } = renderHook(() => useBanners(), { wrapper });

    act(() => result.current.moveUp("b-001"));
    act(() => result.current.moveDown("b-003"));
    expect(ids(result.current.banners)).toEqual(["b-001", "b-002", "b-003"]);

    act(() => result.current.moveUp("b-003"));
    expect(ids(result.current.banners)).toEqual(["b-001", "b-003", "b-002"]);

    act(() => result.current.moveDown("b-001"));
    expect(ids(result.current.banners)).toEqual(["b-003", "b-001", "b-002"]);
  });
});
