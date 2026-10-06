import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { customer, employee, manager, renderWithProviders, superadmin } from "@/test/render";
import Header from "./Header";

const location = () => screen.getByTestId("location").textContent;
const openUserMenu = () => userEvent.click(screen.getByRole("button", { name: "Minha conta" }));

describe("Header", () => {
  it("busca vestidos pelo formulário, mantém o termo e ignora buscas vazias", async () => {
    renderWithProviders(<Header />);
    const desktopSearch = screen.getByPlaceholderText("Buscar vestidos, ocasiões e estilos...");

    fireEvent.submit(desktopSearch.closest("form")!);
    expect(location()).toBe("/");

    await userEvent.type(desktopSearch, "  vestido rosa ");
    fireEvent.submit(desktopSearch.closest("form")!);
    expect(location()).toBe("/produtos?busca=vestido+rosa");
    expect(desktopSearch).toHaveValue("vestido rosa");
  });

  it("preserva os filtros da listagem ao buscar e marca a categoria ativa", async () => {
    renderWithProviders(<Header />, { route: "/produtos?categoria=festa&busca=azul" });
    const desktopSearch = screen.getByPlaceholderText("Buscar vestidos, ocasiões e estilos...");
    expect(desktopSearch).toHaveValue("azul");
    expect(screen.getByRole("link", { name: "Festas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Todos os Vestidos" })).not.toHaveAttribute("aria-current");

    await userEvent.clear(desktopSearch);
    await userEvent.type(desktopSearch, "rosa");
    fireEvent.submit(desktopSearch.closest("form")!);
    expect(location()).toBe("/produtos?categoria=festa&busca=rosa");

    await userEvent.clear(desktopSearch);
    fireEvent.submit(desktopSearch.closest("form")!);
    expect(location()).toBe("/produtos?categoria=festa");
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

  it("fecha o menu do usuário com Escape e devolve o foco ao botão", async () => {
    renderWithProviders(<Header />);
    const accountButton = screen.getByRole("button", { name: "Minha conta" });
    await userEvent.click(accountButton);
    expect(accountButton).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText("Entrar")).not.toBeInTheDocument();
    expect(accountButton).toHaveAttribute("aria-expanded", "false");
    expect(accountButton).toHaveFocus();
  });

  it("busca pelo campo mobile e fecha o menu mobile ao escolher categoria", async () => {
    renderWithProviders(<Header />);
    const mobileSearch = screen.getByPlaceholderText("Buscar vestidos...");
    await userEvent.type(mobileSearch, "midi");
    fireEvent.submit(mobileSearch.closest("form")!);
    expect(location()).toBe("/produtos?busca=midi");

    await userEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByRole("button", { name: "Fechar menu" })).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(screen.getAllByRole("link", { name: "Formatura" })[1]);
    expect(location()).toBe("/produtos?categoria=formatura");
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
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
