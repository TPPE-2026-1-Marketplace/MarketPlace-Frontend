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

function renderPanel(route = "/painel", user = manager) {
  return renderWithProviders(<ManagerDashboard />, { route, path: "/painel/*", user });
}

describe("ManagerDashboard", () => {
  it("bloqueia quem não é funcionário", () => {
    renderPanel("/painel", customer);

    expect(screen.getByText("Acesso Restrito")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fazer Login" })).toHaveAttribute("href", "/login");
  });

  it("mostra a visão geral com KPIs, pedidos e alertas de estoque", async () => {
    renderPanel();

    expect(await screen.findByText("1 produto(s)")).toBeInTheDocument();
    expect(screen.getByText("R$ 350,00")).toBeInTheDocument();
    expect(screen.getByText("Pedidos Recentes")).toBeInTheDocument();
    expect(screen.getAllByText("Vestido Pouco Estoque").length).toBeGreaterThan(0);
    expect(screen.getByText("Gerente · DK Fashion")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cupons/ })).not.toBeInTheDocument();
  });

  it("navega pelas ações rápidas e pelo menu lateral", async () => {
    renderPanel();
    await screen.findByText("Pedidos Recentes");

    await userEvent.click(screen.getByRole("button", { name: /^Ver$/ }));
    expect(location()).toBe("/painel/estoque");

    await userEvent.click(screen.getByRole("button", { name: /Visão Geral/ }));
    expect(location()).toBe("/painel");
    for (const [label, path] of [
      ["Pedidos", "/painel/pedidos"],
      ["Relatórios", "/painel/relatorios"],
      ["Usuários", "/painel/usuarios"],
    ]) {
      await userEvent.click(screen.getByRole("button", { name: /Visão Geral/ }));
      const quick = screen.getAllByRole("button", { name: new RegExp(`^${label}$`) }).slice(-1)[0];
      await userEvent.click(quick);
      expect(location()).toBe(path);
    }

    await userEvent.click(screen.getByRole("button", { name: /Visão Geral/ }));
    await userEvent.click(screen.getByRole("button", { name: /Ver detalhes/ }));
    expect(location()).toBe("/painel/comissoes");
  });

  it.each([
    ["estoque", /Estoque/],
    ["pedidos", "Gerenciamento de Pedidos"],
    ["vendas-pdv", "Vendas Presenciais (PDV)"],
    ["relatorios", "Relatórios e Análises"],
    ["comissoes", /Comiss/],
    ["exportar", "Clientes"],
    ["usuarios", /Usuários|Funcionários/],
    ["banners", /Banners/],
  ])("abre a aba %s", async (tab, heading) => {
    renderPanel(`/painel/${tab}`);

    await waitFor(() => expect(screen.getAllByRole("heading", { name: heading }).length).toBeGreaterThan(0));
  });

  it("super admin vê a aba de cupons", async () => {
    renderPanel("/painel/cupons", superadmin);

    expect(screen.getByText("Super Admin · DK Fashion")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole("heading", { name: /Cupons/ }).length).toBeGreaterThan(0));
  });

  it("funcionário vê só as abas permitidas", () => {
    renderPanel("/painel", employee);
    const nav = within(document.querySelector("nav")!);

    expect(nav.getByRole("button", { name: /Estoque/ })).toBeInTheDocument();
    expect(nav.getByRole("button", { name: /Comissões/ })).toBeInTheDocument();
    expect(nav.queryByRole("button", { name: /Relatórios/ })).not.toBeInTheDocument();
    expect(nav.queryByRole("button", { name: /Usuários/ })).not.toBeInTheDocument();
  });

  it("abre a barra lateral e o seletor de módulos e sai do sistema", async () => {
    renderPanel();

    await userEvent.click(screen.getByRole("button", { name: /Trocar Módulo/ }));
    expect(screen.getByText("Navegação")).toBeInTheDocument();
    await userEvent.click(document.querySelector(".fixed.inset-0.z-40") as HTMLElement);
    expect(screen.queryByText("Navegação")).not.toBeInTheDocument();

    const [openSidebar] = screen.getAllByRole("button").filter((b) => b.className.includes("lg:hidden"));
    await userEvent.click(openSidebar);
    expect(document.querySelector("aside")).toHaveClass("translate-x-0");
    await userEvent.click(document.querySelector(".bg-black\\/60") as HTMLElement);
    expect(document.querySelector("aside")).toHaveClass("-translate-x-full");

    await userEvent.click(screen.getByRole("button", { name: /Trocar Módulo/ }));
    const sair = screen.getAllByRole("button", { name: /Sair/ });
    await userEvent.click(sair[sair.length - 1]);
    expect(location()).toBe("/");
    expect(localStorage.getItem("dk_user")).toBeNull();
  });

  it("registra erro quando os pedidos não carregam", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.get).mockImplementation(apiRouter({ "/products": emptyPage }) as never);
    renderPanel();

    await waitFor(() => expect(error).toHaveBeenCalledWith("Erro ao carregar pedidos do dashboard", expect.any(Error)));
  });
});
