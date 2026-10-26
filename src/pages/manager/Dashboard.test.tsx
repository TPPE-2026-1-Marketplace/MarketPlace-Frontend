import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { apiRouter, emptyPage } from "@/test/apiRouter";
import { customer, employee, manager, renderWithProviders, superadmin } from "@/test/render";
import { ManagerDashboard } from "./Dashboard";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const orders = [
  { idPedido: 1, idUsuario: null, dataPedido: "2026-09-10T10:00:00", status: "pending", subtotal: 100, valorFrete: 0, valorTotal: "100", tipoRetirada: "entrega", codigoRastreamento: null, items: [], clienteNomeAvulso: "Maria" },
  { idPedido: 2, idUsuario: null, dataPedido: "2026-09-11T10:00:00", status: "paid", subtotal: 250, valorFrete: 0, valorTotal: "250", tipoRetirada: "loja", codigoRastreamento: null, items: [] },
  { idPedido: 3, idUsuario: null, dataPedido: "2026-09-12T10:00:00", status: "cancelled", subtotal: 999, valorFrete: 0, valorTotal: "999", tipoRetirada: "loja", codigoRastreamento: null, items: [] },
];

const products = [
  { idProduto: 1, titulo: "Vestido Pouco Estoque", precoBase: 100, sku: "V1", categories: [], variants: [{ codigoSku: "V1-P", precoVariante: 100, ativo: true }] },
  { idProduto: 2, titulo: "Vestido Cheio", precoBase: 200, sku: "V2", categories: [], variants: [{ codigoSku: "V2-P", precoVariante: 200, ativo: true }] },
];

beforeEach(() => {
  vi.mocked(api.get).mockImplementation(
    apiRouter({
      "/orders": { data: orders, meta: emptyPage.meta },
      "/products": { data: products, meta: emptyPage.meta },
      "/inventory/V1-P": { qtdOnline: 2, qtdLojaFisica: 1 },
      "/inventory/V2-P": { qtdOnline: 20, qtdLojaFisica: 10 },
      "/images/catalog/": [],
      "/employees": { data: [] },
      "/people": emptyPage,
      "/coupons": [],
      "/sales-goals": [],
    }) as never,
  );
});

const location = () => screen.getByTestId("location").textContent;
const sidebar = () => within(screen.getByRole("navigation", { name: "Navegação administrativa" }));

function renderPanel(route = "/painel", user = manager) {
  return renderWithProviders(<ManagerDashboard />, { route, path: "/painel/*", user });
}

describe("ManagerDashboard", () => {
  it("bloqueia quem não é funcionário", () => {
    renderPanel("/painel", customer);

    expect(screen.getByRole("heading", { name: "Acesso restrito" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fazer login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Voltar à loja" })).toHaveAttribute("href", "/");
  });

  it("mostra o shell com usuário, contexto e a visão geral", async () => {
    renderPanel();

    expect(screen.getByText("PAINEL GERENCIAL")).toBeInTheDocument();
    expect(screen.getAllByText("Gerente DK · Gerente").length).toBeGreaterThan(0);
    expect(screen.getByText(/^Gerente · /)).toBeInTheDocument();
    expect(sidebar().getByRole("button", { name: "Visão geral" })).toHaveAttribute("aria-current", "page");
    expect(sidebar().queryByRole("button", { name: "Cupons" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir PDV" })).toHaveAttribute("href", "/pdv");
    expect(await screen.findByRole("heading", { level: 1, name: "Visão geral" })).toBeInTheDocument();
    expect(await screen.findByText("Receita total")).toBeInTheDocument();
  });

  it("navega pelo menu lateral", async () => {
    renderPanel();

    for (const [label, path] of [
      ["Estoque", "/painel/estoque"],
      ["Pedidos", "/painel/pedidos"],
      ["Relatórios", "/painel/relatorios"],
      ["Usuários", "/painel/usuarios"],
      ["Comissões", "/painel/comissoes"],
      ["Clientes", "/painel/exportar"],
      ["Visão geral", "/painel"],
    ]) {
      await userEvent.click(sidebar().getByRole("button", { name: label }));
      expect(location()).toBe(path);
      expect(sidebar().getByRole("button", { name: label })).toHaveAttribute("aria-current", "page");
      expect(screen.getByText(/^Painel \//)).toHaveTextContent(`Painel / ${label}`);
    }
  });

  it.each([
    ["estoque", /Estoque/],
    ["pedidos", /Pedidos/],
    ["vendas-pdv", "Vendas Presenciais (PDV)"],
    ["relatorios", "Relatórios e Análises"],
    ["comissoes", /Comiss/],
    ["exportar", "Clientes"],
    ["usuarios", /Usuários|Funcionários/],
  ])("abre a aba %s", async (tab, heading) => {
    renderPanel(`/painel/${tab}`);

    await waitFor(() => expect(screen.getAllByRole("heading", { name: heading }).length).toBeGreaterThan(0));
  });

  it("abre a aba de banners", () => {
    renderPanel("/painel/banners");

    expect(screen.getByText(/^Painel \//)).toHaveTextContent("Painel / Banners");
  });

  it("super admin vê a aba de cupons", async () => {
    renderPanel("/painel/cupons", superadmin);

    expect(screen.getByText(/^Administrador · /)).toBeInTheDocument();
    expect(sidebar().getByRole("button", { name: "Cupons" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole("heading", { name: /Cupons/ }).length).toBeGreaterThan(0));
  });

  it("funcionário vê só as abas permitidas", () => {
    renderPanel("/painel", employee);

    expect(sidebar().getByRole("button", { name: "Estoque" })).toBeInTheDocument();
    expect(sidebar().getByRole("button", { name: "Comissões" })).toBeInTheDocument();
    expect(sidebar().queryByRole("button", { name: "Relatórios" })).not.toBeInTheDocument();
    expect(sidebar().queryByRole("button", { name: "Usuários" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Ana Vendas · Vendedor").length).toBeGreaterThan(0);
  });

  it("abre o menu mobile, navega e sai do painel", async () => {
    renderPanel();

    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    const menu = within(screen.getByRole("dialog", { name: "Painel gerencial" }));
    await userEvent.click(menu.getByRole("button", { name: "Pedidos" }));
    expect(location()).toBe("/painel/pedidos");
    expect(screen.queryByRole("dialog", { name: "Painel gerencial" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await userEvent.click(screen.getByRole("button", { name: "Fechar menu" }));
    expect(screen.queryByRole("dialog", { name: "Painel gerencial" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sair do painel" }));
    expect(location()).toBe("/");
    expect(localStorage.getItem("dk_user")).toBeNull();
  });
});
