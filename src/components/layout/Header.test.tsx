import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { customer, employee, manager, renderWithProviders, superadmin } from "@/test/render";
import Header from "./Header";

const location = () => screen.getByTestId("location").textContent;
// O botão do menu do usuário não tem rótulo acessível: é o vizinho do botão de favoritos.
const openUserMenu = () =>
  userEvent.click(screen.getByLabelText("Favoritos").nextElementSibling!.querySelector("button")!);

describe("Header", () => {
  it("busca vestidos pelo formulário e ignora buscas vazias", async () => {
    renderWithProviders(<Header />);
    const [desktopSearch] = screen.getAllByPlaceholderText("Buscar vestidos...");

    fireEvent.submit(desktopSearch.closest("form")!);
    expect(location()).toBe("/");

    await userEvent.type(desktopSearch, "  vestido rosa ");
    fireEvent.submit(desktopSearch.closest("form")!);
    expect(location()).toBe("/produtos?busca=vestido%20rosa");
    expect(desktopSearch).toHaveValue("");
  });

  it("manda visitantes para o login ao abrir favoritos e mostra opções de entrar", async () => {
    renderWithProviders(<Header />);

    await userEvent.click(screen.getByLabelText("Favoritos"));
    expect(location()).toBe("/login");

    await openUserMenu();
    expect(screen.getByRole("link", { name: "Criar Conta" })).toHaveAttribute("href", "/login?modo=cadastro");
    await userEvent.click(screen.getByRole("link", { name: "Entrar" }));
    expect(screen.queryByRole("link", { name: "Criar Conta" })).not.toBeInTheDocument();
  });

  it("mostra a conta do cliente, os favoritos e permite sair", async () => {
    renderWithProviders(<Header />, { user: customer });

    await userEvent.click(screen.getByLabelText("Favoritos"));
    expect(location()).toBe("/favoritos");

    await openUserMenu();
    expect(screen.getByText("Cliente DK")).toBeInTheDocument();
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.queryByText("Painel Gerencial")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(location()).toBe("/");
    expect(localStorage.getItem("dk_user")).toBeNull();
  });

  it.each([
    [manager, "Gerente", true],
    [superadmin, "Super Admin", true],
    [employee, "Funcionário", false],
  ])("mostra os módulos internos para %o", async (user, label, hasPanel) => {
    renderWithProviders(<Header />, { user });

    await openUserMenu();

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText("PDV - Vendas Presenciais")).toBeInTheDocument();
    expect(screen.queryByText("Painel Gerencial") !== null).toBe(hasPanel);
  });

  it("fecha o menu do usuário ao clicar fora", async () => {
    renderWithProviders(<Header />);
    await openUserMenu();
    expect(screen.getByText("Entrar")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Entrar")).not.toBeInTheDocument();
  });

  it("abre o menu mobile, busca por ele e fecha ao escolher categoria", async () => {
    renderWithProviders(<Header />);
    await userEvent.click(screen.getAllByRole("button")[0]);

    const mobileSearch = screen.getAllByPlaceholderText("Buscar vestidos...")[1];
    await userEvent.type(mobileSearch, "midi");
    fireEvent.submit(mobileSearch.closest("form")!);
    expect(location()).toBe("/produtos?busca=midi");
    expect(screen.getAllByPlaceholderText("Buscar vestidos...")).toHaveLength(1);

    await userEvent.click(screen.getAllByRole("button")[0]);
    await userEvent.click(screen.getAllByRole("link", { name: "Formatura" })[1]);
    expect(location()).toBe("/produtos?categoria=formatura");
  });

  it("mostra a quantidade de itens do carrinho", () => {
    localStorage.setItem(
      "cart",
      JSON.stringify({
        id: 1,
        items: [{ id: 1, quantity: 3, variant: { codigoSku: "A", produto: { idProduto: 1, titulo: "A", precoBase: 10 } } }],
        subtotal: 30,
        desconto: 0,
        total: 30,
      }),
    );
    renderWithProviders(<Header />);

    expect(screen.getByTestId("cart-link")).toHaveTextContent("3");
  });
});
