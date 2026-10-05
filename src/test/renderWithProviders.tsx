/* eslint-disable react-refresh/only-export-components -- helper de teste, fora do fast refresh */
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { CartProvider, type Cart, type CartItem } from "@/hooks/useCart";

/** Flags do React Router v7 (evita os avisos de migração nos testes). */
export const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

/** Item de carrinho para os testes (preço base 899,90 se não informado). */
export function makeCartItem(overrides: {
  sku?: string;
  idProduto?: number;
  titulo?: string;
  preco?: number;
  cor?: string | null;
  tamanho?: string | null;
  quantity?: number;
} = {}): CartItem {
  const {
    sku = "VPR-M",
    idProduto = 1,
    titulo = "Vestido Princesa Rosé",
    preco = 899.9,
    cor = "Rosa antigo",
    tamanho = "M",
    quantity = 1,
  } = overrides;
  return {
    id: idProduto,
    quantity,
    variant: {
      codigoSku: sku,
      produto: { idProduto, titulo, precoBase: preco },
      cor,
      tamanho,
      images: [{ url: `/img/${sku}.jpg` }],
    },
  };
}

/** Grava o carrinho no localStorage antes de montar o CartProvider. */
export function seedCart(items: CartItem[], extra: Partial<Cart> = {}) {
  localStorage.setItem("cart", JSON.stringify({ id: 1, items, ...extra }));
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

/** Renderiza dentro de MemoryRouter + CartProvider, expondo a rota atual. */
export function renderWithProviders(
  ui: React.ReactElement,
  { route = "/", path = "*" }: { route?: string; path?: string } = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]} future={ROUTER_FUTURE}>
      <CartProvider>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={null} />
        </Routes>
        <LocationProbe />
      </CartProvider>
    </MemoryRouter>,
  );
}
