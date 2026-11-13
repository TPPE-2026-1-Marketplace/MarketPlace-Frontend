import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api";
import { manager, renderWithProviders, superadmin } from "@/test/render";
import { Coupons } from "./Coupons";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
const getMock = vi.mocked(api.get);
const postMock = vi.mocked(api.post);
const patchMock = vi.mocked(api.patch);
const deleteMock = vi.mocked(api.delete);

const NOW = new Date("2026-10-27T12:00:00");

const apiCoupons = [
  { numeroDoCupom: "BEMVINDA10", nomeInfluenciador: "Primeira compra", tipoCupom: "porcentagem", valorDesconto: "10", dataInicio: "2026-10-01T03:00:00Z", dataFim: "2026-12-31T12:00:00Z", usoMaximo: 200, usosAtuais: 80, ativo: true, products: [] },
  { numeroDoCupom: "FESTA20", nomeInfluenciador: "@maria", tipoCupom: "porcentagem", valorDesconto: "20", dataInicio: "2026-09-01T12:00:00Z", dataFim: "2026-09-30T12:00:00Z", usoMaximo: null, usosAtuais: 45, ativo: true, products: [{ idProduto: 3, titulo: "Princesa Rosé" }] },
  { numeroDoCupom: "FIXO50", nomeInfluenciador: null, tipoCupom: "fixo", valorDesconto: "50", dataInicio: "2026-10-01T12:00:00Z", dataFim: "2026-11-30T12:00:00Z", usoMaximo: 10, usosAtuais: 3, ativo: false },
];

const rows = () => screen.getAllByRole("row").slice(1);
const row = (code: string) => rows().find((item) => item.textContent?.includes(code)) as HTMLElement;
const kpi = (label: string) => screen.getByText(label, { selector: "p" }).nextElementSibling;
const dialog = () => within(screen.getByRole("dialog"));

async function renderCoupons() {
  renderWithProviders(<Coupons now={NOW} />, { user: superadmin });
  await screen.findByText("Primeira compra · BEMVINDA10");
}

async function applyFilters(values: { search?: string; status?: string }) {
  const search = screen.getByLabelText("Buscar código, campanha ou parceiro");
  await userEvent.clear(search);
  if (values.search) await userEvent.type(search, values.search);
  await userEvent.selectOptions(screen.getByLabelText(/^Status:/), values.status ?? "all");
  await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
}

describe("Coupons", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    deleteMock.mockReset();
    getMock.mockResolvedValue(apiCoupons);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("bloqueia quem não é administrador sem chamar a API", () => {
    renderWithProviders(<Coupons now={NOW} />, { user: manager });

    expect(screen.getByText("Apenas administradores podem gerenciar cupons.")).toBeInTheDocument();
    expect(getMock).not.toHaveBeenCalled();
  });

  it("lista os cupons com indicadores, validade, usos, parceiro e status", async () => {
    await renderCoupons();

    expect(screen.getByRole("heading", { level: 1, name: "Cupons" })).toBeInTheDocument();
    // FESTA20 venceu em setembro: ativo no cadastro, mas expirado.
    expect(kpi("Ativos")).toHaveTextContent("01");
    expect(kpi("Usos")).toHaveTextContent("128");
    expect(kpi("Desconto médio")).toHaveTextContent("15%");
    expect(kpi("Total de cupons")).toHaveTextContent("03");

    expect(row("BEMVINDA10")).toHaveTextContent("10%");
    expect(row("BEMVINDA10")).toHaveTextContent("31 dez");
    expect(row("BEMVINDA10")).toHaveTextContent("80 / 200");
    expect(row("BEMVINDA10")).toHaveTextContent("Ativo");
    expect(row("FESTA20")).toHaveTextContent("45 / sem limite");
    expect(row("FESTA20")).toHaveTextContent("Expirado");
    expect(row("FIXO50")).toHaveTextContent("R$ 50,00");
    expect(row("FIXO50")).toHaveTextContent("DK Fashion");
    expect(row("FIXO50")).toHaveTextContent("Inativo");
  });

  it("filtra por busca e status e limpa os filtros", async () => {
    await renderCoupons();

    await applyFilters({ search: "maria" });
    expect(rows()).toHaveLength(1);
    await applyFilters({ status: "expired" });
    expect(rows()).toHaveLength(1);
    expect(screen.getByLabelText("Status: expirado")).toBeInTheDocument();
    await applyFilters({ status: "inactive", search: "bem" });
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(rows()).toHaveLength(3);
  });

  it("valida e cria um cupom", async () => {
    postMock.mockResolvedValueOnce({});
    await renderCoupons();
    await userEvent.click(screen.getByRole("button", { name: "Novo cupom" }));
    const salvar = dialog().getByRole("button", { name: "Salvar cupom" });

    await userEvent.click(salvar);
    expect(dialog().getByRole("alert")).toHaveTextContent("Preencha código, valor do desconto, data início e data fim.");

    await userEvent.type(dialog().getByLabelText("Campanha / parceiro"), "Black Friday");
    await userEvent.type(dialog().getByLabelText("Código *"), "bf30");
    expect(dialog().getByLabelText("Código *")).toHaveValue("BF30");
    await userEvent.type(dialog().getByLabelText("Valor do desconto *"), "130");
    await userEvent.type(dialog().getByLabelText("Data início *"), "2026-11-20");
    await userEvent.type(dialog().getByLabelText("Data fim *"), "2026-11-10");
    await userEvent.click(salvar);
    expect(dialog().getByRole("alert")).toHaveTextContent("O desconto percentual vai até 100%.");

    await userEvent.clear(dialog().getByLabelText("Valor do desconto *"));
    await userEvent.type(dialog().getByLabelText("Valor do desconto *"), "30");
    await userEvent.click(salvar);
    expect(dialog().getByRole("alert")).toHaveTextContent("A data fim deve ser igual ou posterior à data início.");

    await userEvent.clear(dialog().getByLabelText("Data fim *"));
    await userEvent.type(dialog().getByLabelText("Data fim *"), "2026-11-30");
    await userEvent.type(dialog().getByLabelText("Limite de usos"), "1.5");
    await userEvent.click(salvar);
    expect(dialog().getByRole("alert")).toHaveTextContent("O limite de usos deve ser um número inteiro maior que zero.");

    await userEvent.clear(dialog().getByLabelText("Limite de usos"));
    await userEvent.type(dialog().getByLabelText("Limite de usos"), "500");
    await userEvent.click(salvar);

    expect(postMock).toHaveBeenCalledWith("/coupons", {
      numeroDoCupom: "BF30",
      tipoCupom: "porcentagem",
      valorDesconto: 30,
      ativo: true,
      dataInicio: new Date("2026-11-20T00:00:00").toISOString(),
      dataFim: new Date("2026-11-30T23:59:59").toISOString(),
      usoMaximo: 500,
      nomeInfluenciador: "Black Friday",
    });
    expect(await screen.findByText("Cupom BF30 criado")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("edita um cupom sem trocar o código e mostra o erro da API", async () => {
    patchMock.mockRejectedValueOnce(new ApiError(400, "Data inválida")).mockResolvedValueOnce({});
    await renderCoupons();

    await userEvent.click(screen.getByRole("button", { name: "Editar cupom FIXO50" }));
    expect(dialog().getByRole("heading", { name: "Cupom · FIXO50" })).toBeInTheDocument();
    expect(dialog().queryByLabelText("Código *")).not.toBeInTheDocument();
    expect(dialog().getByLabelText("Tipo de desconto *")).toHaveValue("fixo");
    expect(dialog().getByLabelText("Data fim *")).toHaveValue("2026-11-30");
    expect(dialog().getByText("Produtos aplicáveis").nextElementSibling).toHaveTextContent("Todos os produtos");
    // Inativo: não oferece desativar de novo.
    expect(dialog().queryByRole("button", { name: "Desativar cupom" })).not.toBeInTheDocument();

    await userEvent.selectOptions(dialog().getByLabelText("Status"), "ativo");
    await userEvent.click(dialog().getByRole("button", { name: "Salvar cupom" }));
    expect(await dialog().findByRole("alert")).toHaveTextContent("Data inválida");

    await userEvent.click(dialog().getByRole("button", { name: "Salvar cupom" }));
    expect(patchMock).toHaveBeenLastCalledWith(
      "/coupons/FIXO50",
      expect.objectContaining({ tipoCupom: "fixo", valorDesconto: 50, ativo: true, usoMaximo: 10, nomeInfluenciador: null }),
    );
    expect(patchMock.mock.calls[1][1]).not.toHaveProperty("numeroDoCupom");
    expect(await screen.findByText("Cupom FIXO50 atualizado")).toBeInTheDocument();
  });

  it("desativa com confirmação e mostra os produtos vinculados", async () => {
    patchMock.mockResolvedValueOnce({});
    await renderCoupons();

    await userEvent.click(screen.getByRole("button", { name: "Editar cupom FESTA20" }));
    expect(dialog().getByText("Produtos aplicáveis").nextElementSibling).toHaveTextContent("Princesa Rosé");
    await userEvent.click(dialog().getByRole("button", { name: "Desativar cupom" }));
    expect(dialog().getByRole("heading", { name: "Confirmar desativação" })).toBeInTheDocument();
    await userEvent.click(dialog().getByRole("button", { name: "Cancelar" }));
    expect(patchMock).not.toHaveBeenCalled();

    await userEvent.click(dialog().getByRole("button", { name: "Desativar cupom" }));
    await userEvent.click(dialog().getByRole("button", { name: "Confirmar desativação" }));
    expect(patchMock).toHaveBeenCalledWith("/coupons/FESTA20", { ativo: false });
    expect(await screen.findByText("Cupom FESTA20 desativado")).toBeInTheDocument();
  });

  it("exclui com confirmação e mantém a confirmação mesmo com o cupom fora da lista", async () => {
    deleteMock.mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce(undefined);
    await renderCoupons();

    await userEvent.click(screen.getByRole("button", { name: "Editar cupom BEMVINDA10" }));
    await userEvent.click(dialog().getByRole("button", { name: "Excluir cupom" }));
    expect(dialog().getByText("Consequência").nextElementSibling).toHaveTextContent("O cupom será removido");
    await userEvent.click(dialog().getByRole("button", { name: "Confirmar exclusão" }));
    expect(await dialog().findByRole("alert")).toHaveTextContent("Não foi possível salvar o cupom.");

    getMock.mockResolvedValue(apiCoupons.slice(1));
    await userEvent.click(dialog().getByRole("button", { name: "Excluir cupom" }));
    await userEvent.click(dialog().getByRole("button", { name: "Confirmar exclusão" }));
    expect(deleteMock).toHaveBeenLastCalledWith("/coupons/BEMVINDA10");
    expect(await screen.findByText("Cupom BEMVINDA10 excluído")).toBeInTheDocument();
    await userEvent.click(dialog().getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText("Primeira compra · BEMVINDA10")).not.toBeInTheDocument();
  });

  it("mostra o erro de carregamento e tenta de novo", async () => {
    getMock.mockRejectedValueOnce(new Error("offline"));
    renderWithProviders(<Coupons now={NOW} />, { user: superadmin });

    expect(await screen.findByText("Não foi possível carregar os dados")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Primeira compra · BEMVINDA10")).toBeInTheDocument();
  });
});
