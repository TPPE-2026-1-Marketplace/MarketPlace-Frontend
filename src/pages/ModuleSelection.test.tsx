import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { employee, manager, renderWithProviders, superadmin } from "@/test/render";
import { ModuleSelection } from "./ModuleSelection";

const location = () => screen.getByTestId("location").textContent;

describe("ModuleSelection", () => {
  it("redireciona para o login sem usuário", () => {
    renderWithProviders(<ModuleSelection />, { route: "/selecionar-modulo" });

    expect(location()).toBe("/login");
    expect(screen.queryByText(/Bem-vinda/)).not.toBeInTheDocument();
  });

  it("gerente acessa gestão e PDV", async () => {
    renderWithProviders(<ModuleSelection />, { user: manager, route: "/selecionar-modulo" });

    expect(screen.getByText("Bem-vinda, Gerente DK")).toBeInTheDocument();
    expect(screen.getByText("Acesso: Gerente")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Módulo de Gestão/ }));
    expect(location()).toBe("/painel");

    await userEvent.click(screen.getByRole("button", { name: /PDV - Vendas Presenciais/ }));
    expect(location()).toBe("/pdv");
  });

  it("mostra o perfil de super admin", () => {
    renderWithProviders(<ModuleSelection />, { user: superadmin });
    expect(screen.getByText("Acesso: Super Admin")).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("funcionário só vê o PDV, a comissão e pode sair", async () => {
    renderWithProviders(<ModuleSelection />, { user: employee });

    expect(screen.queryByText("Módulo de Gestão")).not.toBeInTheDocument();
    expect(screen.getByText("Funcionário")).toBeInTheDocument();
    expect(screen.getByText("5%")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Sair do sistema/ }));
    expect(location()).toBe("/login");
    expect(localStorage.getItem("dk_user")).toBeNull();
  });
});
