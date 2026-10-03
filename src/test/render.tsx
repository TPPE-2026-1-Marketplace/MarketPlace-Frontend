import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, type User } from "@/context/AuthContext";
import { BannerProvider } from "@/context/BannerContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { POSProvider } from "@/context/POSContext";
import { CartProvider } from "@/hooks/useCart";
import { LocationDisplay } from "./LocationDisplay";

interface ProvidersOptions {
  /** Rota inicial do MemoryRouter. */
  route?: string;
  /** Padrão de rota para páginas que leem useParams (ex.: "/produtos/:id"). */
  path?: string;
  /** Usuário já logado (gravado em dk_user antes do render). */
  user?: User;
}

/** Mesma árvore de providers do main.tsx, com MemoryRouter no lugar do BrowserRouter. */
export function renderWithProviders(
  ui: ReactElement,
  { route = "/", path, user, ...options }: ProvidersOptions & Omit<RenderOptions, "wrapper"> = {},
) {
  if (user) localStorage.setItem("dk_user", JSON.stringify(user));

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>
      <BannerProvider>
        <POSProvider>
          <FavoritesProvider>
            <CartProvider>
              <MemoryRouter initialEntries={[route]}>
                {path ? (
                  <Routes>
                    <Route path={path} element={children} />
                    <Route path="*" element={null} />
                  </Routes>
                ) : (
                  children
                )}
                <LocationDisplay />
              </MemoryRouter>
            </CartProvider>
          </FavoritesProvider>
        </POSProvider>
      </BannerProvider>
    </AuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

export const customer: User = { id: "111", name: "Cliente DK", email: "cliente@dk.com", role: "customer" };
export const manager: User = { id: "222", name: "Gerente DK", email: "gerente@dk.com", role: "manager" };
export const superadmin: User = { id: "333", name: "Super DK", email: "super@dk.com", role: "superadmin" };
export const employee: User = {
  id: "u-003",
  name: "Ana Vendas",
  email: "ana@dk.com",
  role: "employee",
  sellerCode: "ANA01",
  commissionRate: 5,
};
