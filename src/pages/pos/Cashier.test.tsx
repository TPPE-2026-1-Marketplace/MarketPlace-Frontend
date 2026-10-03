import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../lib/api";
import { employee, manager, renderWithProviders, superadmin } from "@/test/render";
import { Cashier } from "./Cashier";

vi.mock("../../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/api")>()),
  api: { get: vi.fn(), post: vi.fn() },
}));
const getMock = vi.mocked(api.get);
const postMock = vi.mocked(api.post);

const products = [
  {
    idProduto: 1,
    titulo: "Vestido Rosa",
    descricao: null,
    precoBase: 150,
    sku: "DK-ROSA",
    variants: [
      { codigoSku: "ROSA-P", precoVariante: 200, cor: "Rosa", tamanho: "P" },
      { codigoSku: "ROSA-M", precoVariante: 150, cor: null, tamanho: null },
    ],
  },
  { idProduto: 2, titulo: "Saia Azul", descricao: null, precoBase: 80, sku: "DK-SAIA", variants: [] },
];

const location = () => screen.getByTestId("location").textContent;

async function renderCashier(user = superadmin) {
  renderWithProviders(<Cashier />, { user, route: "/pdv" });
  await screen.findByText("Vestido Rosa");
}

async function addRosa(sku = "ROSA-P", quantity = "2") {
  await userEvent.click(screen.getByRole("button", { name: /Vestido Rosa/ }));
  await userEvent.selectOptions(screen.getByRole("combobox"), sku);
  // O campo nunca fica vazio (volta para 1), então o valor é definido de uma vez.
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: quantity } });
  await userEvent.click(screen.getByRole("button", { name: /Adicionar à Venda/ }));
}

describe("Cashier (PDV)", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    getMock.mockResolvedValue({ data: products });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("manda para o login sem usuário", () => {
    renderWithProviders(<Cashier />, { route: "/pdv" });
    expect(location()).toBe("/login");
  });

  it("carrega os produtos, busca e mostra o papel do usuário", async () => {
    await renderCashier();

    expect(getMock).toHaveBeenCalledWith("/products?limit=100");
    expect(screen.getByText("Super DK • Admin")).toBeInTheDocument();
    expect(screen.getByText("Produtos Disponíveis (2)")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Buscar por nome ou código SKU..."), "saia");
    expect(screen.getByText("Produtos Disponíveis (1)")).toBeInTheDocument();
    // Botão de voltar (só ícone) fica antes do título do PDV.
    await userEvent.click(screen.getByRole("heading", { name: "PDV - Ponto de Venda" }).parentElement!.previousElementSibling as HTMLElement);
    expect(location()).toBe("/selecionar-modulo");
  });

  it("mostra erro ao carregar e permite tentar de novo", async () => {
    getMock.mockRejectedValueOnce(new Error("offline"));
    renderWithProviders(<Cashier />, { user: manager, route: "/pdv" });

    expect(await screen.findByText("Erro ao carregar produtos. Verifique a conexão.")).toBeInTheDocument();
    expect(screen.getByText("Gerente DK • Gerente")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Vestido Rosa")).toBeInTheDocument();
  });

  it("exige variação antes de adicionar e monta a venda", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderCashier();

    await userEvent.click(screen.getByRole("button", { name: /Saia Azul/ }));
    expect(screen.getByRole("option", { name: "Nenhuma variação cadastrada" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Adicionar à Venda/ }));
    expect(screen.getByText("Selecione o produto e a variação.")).toBeInTheDocument();

    await addRosa();
    expect(screen.getByText("Produto adicionado à venda!")).toBeInTheDocument();
    expect(screen.getByText("Itens da Venda (1)")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 400,00").length).toBeGreaterThan(0);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText("Produto adicionado à venda!")).not.toBeInTheDocument();

    await addRosa("ROSA-M", "1");
    expect(screen.getByText("Itens da Venda (2)")).toBeInTheDocument();
    expect(screen.getAllByText(/Padrão/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("R$ 550,00").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Limpar tudo" }));
    expect(screen.getByText("Nenhum item adicionado")).toBeInTheDocument();
  });

  it("ajusta e remove itens da venda", async () => {
    await renderCashier();
    await addRosa("ROSA-P", "1");
    const item = screen.getByText("Itens da Venda (1)").closest("div.bg-white") as HTMLElement;
    const buttons = within(item).getAllByRole("button").filter((b) => b.textContent === "");
    const [remove, minus, plus] = buttons;

    await userEvent.click(plus);
    expect(screen.getAllByText("R$ 400,00").length).toBeGreaterThan(0);
    await userEvent.click(minus);
    expect(screen.getAllByText("R$ 200,00").length).toBeGreaterThan(0);
    await userEvent.click(remove);
    expect(screen.getByText("Nenhum item adicionado")).toBeInTheDocument();
  });

  it("não abre o fechamento com a venda vazia", async () => {
    await renderCashier();
    await addRosa();
    await userEvent.click(screen.getByRole("button", { name: "Limpar tudo" }));
    expect(screen.queryByRole("button", { name: "Finalizar Venda" })).not.toBeInTheDocument();
  });

  it("valida vendedor e cliente e conclui a venda no PIX", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    postMock.mockResolvedValueOnce({ idPedido: 77 });
    await renderCashier();
    await addRosa();

    await userEvent.click(screen.getByRole("button", { name: "Finalizar Venda" }));
    expect(screen.getByRole("heading", { name: "Finalizar Venda" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar Venda" }));
    expect(screen.getByText("Informe o código do vendedor (CPF).")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Ex: VEND01 ou CPF"), "ANA01");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar Venda" }));
    expect(screen.getByText("O nome do cliente é obrigatório.")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Nome completo do cliente"), "Maria");
    await userEvent.type(screen.getByPlaceholderText("CPF do cliente"), "123.456.789-00");
    await userEvent.click(screen.getByRole("button", { name: /PIX/ }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar Venda" }));

    expect(await screen.findByText("Venda #77 finalizada com sucesso!")).toBeInTheDocument();
    expect(postMock).toHaveBeenCalledWith("/orders/in-store", expect.objectContaining({
      codigoVendedor: "ANA01",
      idUsuario: "12345678900",
      clienteNomeAvulso: "Maria",
    }));
    expect(screen.queryByRole("heading", { name: "Finalizar Venda" })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText("Venda #77 finalizada com sucesso!")).not.toBeInTheDocument();
  });

  it("vendedor logado vende com o próprio CPF e vê erros da API", async () => {
    postMock.mockRejectedValueOnce(new Error("Estoque insuficiente"));
    await renderCashier(employee);
    expect(screen.getByText("Ana Vendas • Vendedor")).toBeInTheDocument();
    await addRosa();

    await userEvent.click(screen.getByRole("button", { name: "Finalizar Venda" }));
    expect(screen.getByPlaceholderText("Ex: VEND01 ou CPF")).toHaveValue("u-003");
    expect(screen.getByPlaceholderText("Ex: VEND01 ou CPF")).toBeDisabled();
    await userEvent.type(screen.getByPlaceholderText("Nome completo do cliente"), "Joana");
    await userEvent.click(screen.getByRole("button", { name: /Dinheiro/ }));
    await userEvent.click(screen.getByRole("button", { name: /Cartão/ }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar Venda" }));

    expect(await screen.findByText("Estoque insuficiente")).toBeInTheDocument();
    expect(postMock.mock.calls[0][1]).toMatchObject({ codigoVendedor: "u-003" });

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("heading", { name: "Finalizar Venda" })).not.toBeInTheDocument();
  });
});
