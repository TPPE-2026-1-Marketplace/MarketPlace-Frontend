import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../lib/api";
import { manager, renderWithProviders, superadmin } from "@/test/render";
import { Coupons } from "./Coupons";

vi.mock("../../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
const getMock = vi.mocked(api.get);

const apiCoupons = [
  { numeroDoCupom: "DK10", nomeInfluenciador: "Maria Festas", tipoCupom: "porcentagem", valorDesconto: "10", dataInicio: "2026-09-01T12:00:00Z", dataFim: "2026-09-30T12:00:00Z", usoMaximo: 10, usosAtuais: 9, ativo: true, products: [{ idProduto: 3 }] },
  { numeroDoCupom: "FIXO50", nomeInfluenciador: null, tipoCupom: "fixo", valorDesconto: "50", dataInicio: "2026-10-01T12:00:00Z", dataFim: "2026-10-31T12:00:00Z", usoMaximo: 0, usosAtuais: 3, ativo: false },
];

const rows = () => screen.getAllByRole("row").slice(1);

async function renderCoupons() {
  renderWithProviders(<Coupons />, { user: superadmin });
  await screen.findByText("Cupons e Campanhas");
}

function modalInput(label: string) {
  return screen.getByText(label).nextElementSibling as HTMLInputElement;
}

describe("Coupons", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.delete).mockReset();
    getMock.mockReset();
    getMock.mockResolvedValue(apiCoupons);
  });

  it("bloqueia quem não é super admin", () => {
    renderWithProviders(<Coupons />, { user: manager });
    expect(screen.getByText("Acesso restrito: apenas administradores podem gerenciar cupons.")).toBeInTheDocument();
    expect(getMock).not.toHaveBeenCalled();
  });

  it("mostra o carregamento e o erro da API", async () => {
    getMock.mockRejectedValueOnce(new Error("Falha nos cupons"));
    renderWithProviders(<Coupons />, { user: superadmin });
    expect(screen.getByText("Carregando cupons...")).toBeInTheDocument();
    expect(await screen.findByText("Falha nos cupons")).toBeInTheDocument();
  });

  it("converte os cupons do backend e calcula os indicadores", async () => {
    await renderCoupons();

    expect(screen.getByText("2 cupons cadastrados")).toBeInTheDocument();
    expect(screen.getByText("Cupons Ativos").nextElementSibling).toHaveTextContent("1");
    expect(screen.getByText("Total de Usos").nextElementSibling).toHaveTextContent("12");
    expect(screen.getByText("Desconto Médio").nextElementSibling).toHaveTextContent("10%");
    expect(within(rows()[0]).getByText("10%")).toBeInTheDocument();
    expect(within(rows()[0]).getByText("9 / 10")).toBeInTheDocument();
    expect(within(rows()[1]).getByText("R$ 50.00")).toBeInTheDocument();
    expect(within(rows()[1]).getByText("3 / ∞")).toBeInTheDocument();
    expect(within(rows()[1]).getByText("Campanha Padrão")).toBeInTheDocument();
  });

  it("filtra pela busca", async () => {
    await renderCoupons();

    await userEvent.type(screen.getByPlaceholderText("Buscar por código, campanha ou parceiro..."), "maria");
    expect(rows()).toHaveLength(1);
  });

  it("valida, cria e recarrega os cupons", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(api.post).mockResolvedValueOnce({});
    await renderCoupons();

    await userEvent.click(screen.getByRole("button", { name: /Novo Cupom/ }));
    await userEvent.click(screen.getByRole("button", { name: "Criar Cupom" }));
    expect(alert).toHaveBeenCalledWith("Preencha todos os campos obrigatórios (Código, Desconto, Início e Fim).");

    await userEvent.type(modalInput("Nome da Campanha (ou Parceiro) *"), "Primavera");
    await userEvent.type(modalInput("Código do Cupom *"), "flor15");
    await userEvent.selectOptions(modalInput("Tipo de Desconto *"), "fixed");
    await userEvent.type(modalInput("Valor do Desconto *"), "15");
    fireEvent.change(modalInput("Data Início *"), { target: { value: "2026-10-01" } });
    fireEvent.change(modalInput("Data Fim *"), { target: { value: "2026-10-31" } });
    await userEvent.type(modalInput("Limite de Uso"), "100");
    await userEvent.click(screen.getByLabelText("Cupom ativo"));
    await userEvent.click(screen.getByRole("button", { name: "Criar Cupom" }));

    expect(api.post).toHaveBeenCalledWith("/coupons", expect.objectContaining({
      numeroDoCupom: "FLOR15",
      tipoCupom: "fixo",
      valorDesconto: 15,
      ativo: false,
      usoMaximo: 100,
      nomeInfluenciador: "Primavera",
    }));
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("button", { name: "Criar Cupom" })).not.toBeInTheDocument();
  });

  it("edita um cupom sem permitir trocar o código", async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({});
    await renderCoupons();

    await userEvent.click(within(rows()[0]).getByTitle("Editar"));
    expect(modalInput("Código do Cupom *")).toHaveValue("DK10");
    expect(modalInput("Código do Cupom *")).toBeDisabled();
    const limite = modalInput("Limite de Uso");
    await userEvent.clear(limite);
    await userEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    expect(api.patch).toHaveBeenCalledWith("/coupons/DK10", expect.objectContaining({ tipoCupom: "porcentagem", usoMaximo: null }));
  });

  it("mostra erro ao salvar e fecha o modal sem salvar", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(api.patch).mockRejectedValueOnce(new Error("409"));
    await renderCoupons();

    await userEvent.click(within(rows()[0]).getByTitle("Editar"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));
    expect(alert).toHaveBeenCalledWith("Erro ao salvar cupom: 409");

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("button", { name: "Salvar Alterações" })).not.toBeInTheDocument();
  });

  it("ativa/desativa e exclui cupons, tratando erros", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    vi.mocked(api.patch).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("500"));
    vi.mocked(api.delete).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("404"));
    await renderCoupons();

    await userEvent.click(within(rows()[1]).getByRole("button", { name: /Inativo/ }));
    expect(api.patch).toHaveBeenCalledWith("/coupons/FIXO50", { ativo: true });
    expect(within(rows()[1]).getByRole("button", { name: /Ativo/ })).toBeInTheDocument();
    await userEvent.click(within(rows()[1]).getByRole("button", { name: /Ativo/ }));
    expect(alert).toHaveBeenCalledWith("Erro ao alterar status: 500");

    await userEvent.click(within(rows()[0]).getByTitle("Excluir"));
    expect(api.delete).not.toHaveBeenCalled();
    await userEvent.click(within(rows()[0]).getByTitle("Excluir"));
    expect(api.delete).toHaveBeenCalledWith("/coupons/DK10");
    expect(rows()).toHaveLength(1);
    await userEvent.click(within(rows()[0]).getByTitle("Excluir"));
    expect(alert).toHaveBeenCalledWith("Erro ao excluir: 404");
    expect(confirm).toHaveBeenCalledTimes(3);
  });
});
