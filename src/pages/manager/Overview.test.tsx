import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { apiRouter, emptyPage } from "@/test/apiRouter";
import { employee, manager, renderWithProviders } from "@/test/render";
import { Overview } from "./Overview";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const NOW = new Date("2026-10-20T12:00:00");

const order = (idPedido: number, dataPedido: string, status: string, valorTotal: string, extra = {}) => ({
  idPedido,
  idUsuario: null,
  dataPedido,
  status,
  subtotal: valorTotal,
  valorFrete: 0,
  valorTotal,
  tipoRetirada: "entrega",
  codigoRastreamento: null,
  items: [],
  ...extra,
});

const orders = [
  order(1, "2026-10-18T10:00:00", "pending", "100", { clienteNomeAvulso: "Marina Oliveira" }),
  order(2, "2026-10-05T10:00:00", "paid", "300", { tipoRetirada: "loja", user: { nome: "Camila Santos" } }),
  order(3, "2026-10-02T10:00:00", "cancelled", "999"),
  order(4, "2026-09-25T10:00:00", "shipped", "200"),
  order(5, "2026-06-10T10:00:00", "delivered", "50"),
  order(6, "2026-01-10T10:00:00", "delivered", "5000"),
];

const products = [
  { idProduto: 1, titulo: "Vestido Rosa", precoBase: 100, sku: "V1", categories: [], variants: [{ codigoSku: "V1-P", precoVariante: 100, ativo: true }] },
  { idProduto: 2, titulo: "Vestido Azul", precoBase: 200, sku: "V2", categories: [], variants: [{ codigoSku: "V2-P", precoVariante: 200, ativo: true }] },
];

const routes = {
  "/orders": { data: orders, meta: emptyPage.meta },
  "/products": { data: products, meta: emptyPage.meta },
  "/inventory/V1-P": { qtdOnline: 2, qtdLojaFisica: 1 },
  "/inventory/V2-P": { qtdOnline: 20, qtdLojaFisica: 10 },
  "/images/catalog/": [],
};

const kpi = (label: string) => screen.getByText(label, { selector: "p" }).nextElementSibling;
const rowCount = () => screen.getAllByRole("row").length - 1;

function renderOverview(user = manager) {
  return renderWithProviders(<Overview now={NOW} />, { user });
}

async function choosePeriod(value: string) {
  await userEvent.selectOptions(screen.getByLabelText(/^Período:/), value);
  await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
}

describe("Overview", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(apiRouter(routes) as never);
  });

  it("mostra indicadores do mês, gráfico de 6 meses e registros recentes", async () => {
    renderOverview();
    expect(screen.getByText("Carregando dados")).toBeInTheDocument();
    await screen.findByText("Receita total");

    expect(screen.getByRole("heading", { level: 1, name: "Visão geral" })).toBeInTheDocument();
    // Outubro sem o cancelado: 100 + 300.
    expect(kpi("Receita total")).toHaveTextContent("R$ 400,00");
    expect(kpi("Pedidos pendentes")).toHaveTextContent("01");
    expect(kpi("Estoque online")).toHaveTextContent("22");
    expect(kpi("Estoque loja")).toHaveTextContent("11");

    const chart = within(screen.getByRole("region", { name: "Evolução da receita" }));
    // Intl usa espaço não separável depois de "R$".
    expect(chart.getAllByRole("listitem").map((item) => item.textContent?.replace(/\s/g, " "))).toEqual([
      "Mai: R$ 0,00",
      "Jun: R$ 50,00",
      "Jul: R$ 0,00",
      "Ago: R$ 0,00",
      "Set: R$ 200,00",
      "Out: R$ 400,00",
    ]);
    const bars = chart.getAllByTestId("revenue-bar");
    expect(bars[5]).toHaveStyle({ height: "115px" });
    expect(bars[5]).toHaveClass("bg-[var(--color-brand)]");
    expect(bars[0]).toHaveStyle({ height: "4px" });

    const table = within(screen.getByRole("region", { name: "Registros recentes" }));
    expect(table.getAllByRole("row")).toHaveLength(4);
    expect(table.getByText("Marina Oliveira")).toBeInTheDocument();
    expect(table.getByText("Camila Santos")).toBeInTheDocument();
    expect(table.getByText("Cancelado")).toBeInTheDocument();
    expect(table.getAllByText("Entrega").length).toBeGreaterThan(0);
  });

  it("aplica o período escolhido só ao clicar em Aplicar filtros", async () => {
    renderOverview();
    await screen.findByText("Receita total");

    await userEvent.selectOptions(screen.getByLabelText(/^Período:/), "30d");
    expect(rowCount()).toBe(3);
    await choosePeriod("30d");
    expect(rowCount()).toBe(4);
    expect(kpi("Receita total")).toHaveTextContent("R$ 600,00");
    await choosePeriod("6m");
    expect(rowCount()).toBe(5);
    expect(screen.getByText("Exibindo 5 registros")).toBeInTheDocument();
    expect(kpi("Receita total")).toHaveTextContent("R$ 650,00");
  });

  it("mostra o estado sem resultados e volta ao período padrão", async () => {
    vi.mocked(api.get).mockImplementation(
      apiRouter({ ...routes, "/orders": { data: [orders[5]], meta: emptyPage.meta } }) as never,
    );
    renderOverview();

    expect(await screen.findByText("Nenhum resultado encontrado")).toBeInTheDocument();
    await choosePeriod("6m");
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(screen.getByLabelText(/^Período:/)).toHaveValue("month");
  });

  it("abre o resumo de desempenho e leva aos relatórios", async () => {
    renderOverview();
    await screen.findByText("Receita total");

    await userEvent.click(screen.getByRole("button", { name: "Consultar relatórios" }));
    const dialog = within(screen.getByRole("dialog", { name: "Resumo de desempenho" }));
    expect(dialog.getByText("R$ 400,00")).toBeInTheDocument();
    expect(dialog.getByText("02")).toBeInTheDocument();
    expect(dialog.getByText("R$ 200,00")).toBeInTheDocument();

    await userEvent.click(dialog.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Consultar relatórios" }));
    await userEvent.click(screen.getByRole("button", { name: "Ver relatórios" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/painel/relatorios");
  });

  it("funcionário vê o resumo sem o atalho para relatórios", async () => {
    renderOverview(employee);
    await screen.findByText("Receita total");

    await userEvent.click(screen.getByRole("button", { name: "Consultar relatórios" }));
    expect(screen.getByRole("dialog", { name: "Resumo de desempenho" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver relatórios" })).not.toBeInTheDocument();
  });

  it("mostra o erro de carregamento e tenta de novo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.get).mockImplementation(apiRouter({ "/products": emptyPage }) as never);
    renderOverview();

    expect(await screen.findByText("Não foi possível carregar os dados")).toBeInTheDocument();
    vi.mocked(api.get).mockImplementation(apiRouter(routes) as never);
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(screen.getByText("Receita total")).toBeInTheDocument());
  });
});
