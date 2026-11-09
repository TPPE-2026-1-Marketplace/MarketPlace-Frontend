import { act, fireEvent, screen } from "@testing-library/react";
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
  await userEvent.click(screen.getByRole("button", { name: "Selecionar produto: Vestido Rosa" }));
  if (sku === "ROSA-M") await userEvent.click(screen.getByRole("button", { name: "Padrão" }));
  await userEvent.click(screen.getByRole("button", { name: sku === "ROSA-M" ? "Tamanho Único" : "Tamanho P" }));
  // O campo nunca fica vazio (volta para 1), então o valor é definido de uma vez.
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: quantity } });
  await userEvent.click(screen.getByRole("button", { name: /Adicionar à venda/ }));
}

describe("Cashier (PDV)", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    getMock.mockImplementation(async (path) => {
      if (path.startsWith("/inventory/")) return { qtdOnline: 50, qtdLojaFisica: 10 };
      if (path.startsWith("/images/catalog/")) return [];
      if (path === "/employees") return { data: [
        { cpf: "seller-ana", ativo: true, role_perfil: "vendedor", codigo_funcionario: "ANA01", person: { nome: "Ana Vendas" } },
        { cpf: "seller-carlos", ativo: true, role_perfil: "vendedor", codigo_funcionario: "CARLOS02", person: { nome: "Carlos Moda" } },
        { cpf: "seller-inactive", ativo: false, role_perfil: "vendedor", codigo_funcionario: "INATIVO", person: { nome: "Vendedor inativo" } },
      ] };
      return { data: products };
    });
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
    expect(screen.getByText("Super DK · Admin")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Produtos disponíveis" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selecionar produto: Saia Azul" })).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Buscar por nome ou código SKU..."), "saia");
    expect(screen.queryByRole("button", { name: "Selecionar produto: Vestido Rosa" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Painel" }));
    expect(location()).toBe("/selecionar-modulo");
  });

  it("mostra erro ao carregar e permite tentar de novo", async () => {
    getMock.mockRejectedValueOnce(new Error("offline"));
    renderWithProviders(<Cashier />, { user: manager, route: "/pdv" });

    expect(await screen.findByText("Erro ao carregar produtos. Verifique a conexão.")).toBeInTheDocument();
    expect(screen.getByText("Gerente DK · Gerente")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Vestido Rosa")).toBeInTheDocument();
  });

  it("exige variação antes de adicionar e monta a venda", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderCashier();

    await userEvent.click(screen.getByRole("button", { name: "Selecionar produto: Saia Azul" }));
    expect(screen.getByText("Nenhuma variação cadastrada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar à venda/ })).toBeDisabled();

    await addRosa();
    expect(screen.getByText("Produto adicionado à venda!")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Venda atual" })).toBeInTheDocument();
    expect(screen.getAllByText(/Total · R\$\s400,00/).length).toBeGreaterThan(0);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText("Produto adicionado à venda!")).not.toBeInTheDocument();

    await addRosa("ROSA-M", "1");
    expect(screen.getAllByRole("article", { name: "Vestido Rosa" })).toHaveLength(2);
    expect(screen.getAllByText(/Padrão/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Total · R\$\s550,00/).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Limpar tudo" }));
    expect(screen.getByText("Nenhum item adicionado")).toBeInTheDocument();
  });

  it("ajusta e remove itens da venda", async () => {
    await renderCashier();
    await addRosa("ROSA-P", "1");
    const remove = screen.getByRole("button", { name: "Remover item" });
    const minus = screen.getByRole("button", { name: "Diminuir quantidade de Vestido Rosa" });
    const plus = screen.getByRole("button", { name: "Aumentar quantidade de Vestido Rosa" });

    await userEvent.click(plus);
    expect(screen.getAllByText(/Total · R\$\s400,00/).length).toBeGreaterThan(0);
    await userEvent.click(minus);
    expect(screen.getAllByText(/Total · R\$\s200,00/).length).toBeGreaterThan(0);
    await userEvent.click(remove);
    expect(screen.getByText("Nenhum item adicionado")).toBeInTheDocument();
  });

  it("não abre o fechamento com a venda vazia", async () => {
    await renderCashier();
    await addRosa();
    await userEvent.click(screen.getByRole("button", { name: "Limpar tudo" }));
    expect(screen.getByRole("button", { name: "Finalizar venda" })).toBeDisabled();
  });

  it("valida vendedor e cliente e conclui a venda no PIX", async () => {
    postMock.mockResolvedValueOnce({ idPedido: 77 });
    await renderCashier();
    await addRosa();

    await userEvent.click(screen.getByRole("button", { name: "Finalizar venda" }));
    expect(screen.getByRole("heading", { name: "Finalizar venda" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar venda" }));
    expect(screen.getByText("Informe o código do vendedor (CPF).")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Ex: VEND01 ou CPF"), "ANA01");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar venda" }));
    expect(screen.getByText("O nome do cliente é obrigatório.")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Nome completo do cliente"), "Maria");
    await userEvent.type(screen.getByPlaceholderText("CPF do cliente"), "529.982.247-25");
    await userEvent.click(screen.getByRole("button", { name: /Pix/ }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar venda" }));

    expect(await screen.findByRole("heading", { name: "Venda concluída" })).toBeInTheDocument();
    expect(screen.getByText("Venda #77 registrada com sucesso.")).toBeInTheDocument();
    expect(screen.getByText(/Cliente: Maria · Vendedor: ANA01 · Total: R\$\s400,00/)).toBeInTheDocument();
    expect(postMock).toHaveBeenCalledWith("/orders/in-store", expect.objectContaining({
      codigoVendedor: "ANA01",
      idUsuario: "52998224725",
      clienteNomeAvulso: "Maria",
    }));
    expect(screen.queryByRole("heading", { name: "Finalizar venda" })).not.toBeInTheDocument();

    // A venda foi limpa: "Nova venda" volta ao catálogo com a lista vazia.
    await userEvent.click(screen.getByRole("button", { name: "Nova venda" }));
    expect(screen.getByText("Nenhum item adicionado")).toBeInTheDocument();
  });

  it("vendedor logado inicia com seu identificador editável", async () => {
    postMock.mockResolvedValueOnce({ idPedido: 78 });
    await renderCashier(employee);
    expect(screen.getByText("Ana Vendas · Vendedor")).toBeInTheDocument();
    await addRosa();

    await userEvent.click(screen.getByRole("button", { name: "Finalizar venda" }));
    expect(screen.getByPlaceholderText("Ex: VEND01 ou CPF")).toHaveValue("ANA01");
    expect(screen.getByPlaceholderText("Ex: VEND01 ou CPF")).toBeEnabled();
    await userEvent.type(screen.getByPlaceholderText("Nome completo do cliente"), "Joana");
    await userEvent.click(screen.getByRole("button", { name: /Dinheiro/ }));
    await userEvent.click(screen.getByRole("button", { name: /Cartão/ }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar venda" }));

    expect(await screen.findByRole("heading", { name: "Venda concluída" })).toBeInTheDocument();
    expect(postMock.mock.calls[0][1]).toMatchObject({ codigoVendedor: "ANA01" });
  });

  it("mostra a falha da venda preservando os itens e permite voltar à venda", async () => {
    postMock.mockRejectedValueOnce(new Error("Estoque insuficiente"));
    await renderCashier(employee);
    await addRosa();

    await userEvent.click(screen.getByRole("button", { name: "Finalizar venda" }));
    await userEvent.type(screen.getByPlaceholderText("Nome completo do cliente"), "Joana");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar venda" }));

    expect(await screen.findByRole("heading", { name: "Falha na venda" })).toBeInTheDocument();
    expect(screen.getByText("Motivo: Estoque insuficiente")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Voltar à venda" }));
    expect(screen.getByRole("region", { name: "Venda atual" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finalizar venda" })).toBeInTheDocument();
  });

  it("tenta de novo após a falha com os mesmos dados e conclui a venda", async () => {
    postMock.mockRejectedValueOnce(new Error("Sem conexão")).mockResolvedValueOnce({ idPedido: 79 });
    await renderCashier(employee);
    await addRosa();

    await userEvent.click(screen.getByRole("button", { name: "Finalizar venda" }));
    await userEvent.type(screen.getByPlaceholderText("Nome completo do cliente"), "Joana");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar venda" }));
    await screen.findByRole("heading", { name: "Falha na venda" });

    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("heading", { name: "Venda concluída" })).toBeInTheDocument();
    expect(screen.getByText("Venda #79 registrada com sucesso.")).toBeInTheDocument();
    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[1][1]).toEqual(postMock.mock.calls[0][1]);
  });

  it("bloqueia a venda quando o CPF do cliente é inválido", async () => {
    await renderCashier();
    await addRosa();

    await userEvent.click(screen.getByRole("button", { name: "Finalizar venda" }));
    await userEvent.type(screen.getByPlaceholderText("Ex: VEND01 ou CPF"), "ANA01");
    await userEvent.type(screen.getByPlaceholderText("Nome completo do cliente"), "Maria");
    await userEvent.type(screen.getByPlaceholderText("CPF do cliente"), "12345678900");
    expect(screen.getByPlaceholderText("CPF do cliente")).toHaveValue("123.456.789-00");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar venda" }));

    expect(screen.getByText("CPF inválido. Confira os números digitados.")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalledWith("/orders/in-store", expect.anything());
  });

  it("mostra o pagamento em página, com resumo e campos opcionais", async () => {
    await renderCashier();
    await addRosa("ROSA-P", "1");
    await userEvent.click(screen.getByRole("button", { name: "Finalizar venda" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Produtos disponíveis" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Resumo da venda" })).toHaveTextContent("Vestido Rosa · Rosa / P · 1 unidade");
    expect(screen.getByLabelText("Telefone (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail (opcional)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cartão" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Confira a aprovação na maquininha antes de registrar a venda.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Pix" }));
    expect(screen.getByRole("button", { name: "Pix" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Cartão" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Confira o pagamento no sistema de recebimento antes de confirmar.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Dinheiro" }));
    expect(screen.getByText("Confira o valor recebido antes de registrar a venda.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar finalização" }));
    expect(screen.getByRole("region", { name: "Venda atual" })).toHaveTextContent("Vestido Rosa");
    expect(screen.getByRole("button", { name: "Finalizar venda" })).toBeEnabled();
  });

  it("limpa uma busca sem resultados e mantém a venda vazia bloqueada", async () => {
    await renderCashier();
    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar produto ou SKU" }), "inexistente");
    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
    expect(screen.getByRole("heading", { name: "Nenhum produto encontrado" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finalizar venda" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(screen.getByRole("button", { name: "Selecionar produto: Vestido Rosa" })).toBeInTheDocument();
  });

  it("seleciona vendedor pelo nome e sincroniza com o código digitado", async () => {
    postMock.mockResolvedValueOnce({ idPedido: 90 });
    await renderCashier();
    await addRosa("ROSA-P", "1");
    await userEvent.click(screen.getByRole("button", { name: "Finalizar venda" }));
    const sellers = screen.getByLabelText("Selecionar vendedor");
    expect(screen.queryByRole("option", { name: /Vendedor inativo/ })).not.toBeInTheDocument();
    await userEvent.selectOptions(sellers, "seller-carlos");
    expect(screen.getByLabelText("Código do vendedor *")).toHaveValue("CARLOS02");
    fireEvent.change(screen.getByLabelText("Código do vendedor *"), { target: { value: "ana01" } });
    expect(sellers).toHaveValue("seller-ana");
    await userEvent.selectOptions(sellers, "seller-carlos");
    await userEvent.type(screen.getByLabelText("Nome da cliente *"), "Maria");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar venda" }));
    await screen.findByRole("heading", { name: "Venda concluída" });
    expect(postMock).toHaveBeenCalledWith("/orders/in-store", expect.objectContaining({ codigoVendedor: "CARLOS02" }));
  });

  it("permite digitar o código quando a lista de vendedores falha", async () => {
    const original = getMock.getMockImplementation()!;
    getMock.mockImplementation(async (path, params) => {
      if (path === "/employees") throw new Error("offline");
      return original(path, params);
    });
    await renderCashier();
    await addRosa();
    await userEvent.click(screen.getByRole("button", { name: "Finalizar venda" }));
    expect(screen.getByText(/Não foi possível carregar os vendedores/)).toBeInTheDocument();
    expect(screen.getByLabelText("Código do vendedor *")).toBeEnabled();
    expect(screen.getByLabelText("Selecionar vendedor")).toBeDisabled();
  });

  it("seleciona pela foto e bloqueia tamanhos sem saldo físico", async () => {
    const original = getMock.getMockImplementation()!;
    getMock.mockImplementation(async (path, params) => {
      if (path === "/inventory/ROSA-P") return { qtdOnline: 10, qtdLojaFisica: 0 };
      if (path === "/images/catalog/ROSA-P") return [{ ordemNoCatalogo: 1, image: { idImagem: 1, url: "/vestido.jpg", ordem: 1, descricao: null } }];
      return original(path, params);
    });
    await renderCashier();
    expect(screen.getByAltText("Vestido Rosa")).toHaveAttribute("src", "/vestido.jpg");
    await userEvent.click(screen.getByRole("button", { name: "Ver produto: Vestido Rosa" }));
    await userEvent.click(screen.getByRole("button", { name: "Rosa" }));
    expect(screen.getByRole("button", { name: "Tamanho P — indisponível" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adicionar à venda" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Padrão" }));
    await userEvent.click(screen.getByRole("button", { name: "Tamanho Único" }));
    expect(screen.getByRole("button", { name: "Tamanho Único" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Adicionar à venda" })).toBeEnabled();
  });

  it("considera as unidades já no carrinho para limitar o estoque", async () => {
    const original = getMock.getMockImplementation()!;
    getMock.mockImplementation(async (path, params) => {
      if (path === "/inventory/ROSA-P") return { qtdOnline: 30, qtdLojaFisica: 2 };
      return original(path, params);
    });
    await renderCashier();
    await addRosa("ROSA-P", "2");
    expect(screen.getByRole("button", { name: "Aumentar quantidade de Vestido Rosa" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Selecionar produto: Vestido Rosa" }));
    await userEvent.click(screen.getByRole("button", { name: "Rosa" }));
    expect(screen.getByRole("button", { name: "Tamanho P — indisponível" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adicionar à venda" })).toBeDisabled();
  });

  it("não permite adicionar quando a consulta de estoque falha", async () => {
    const original = getMock.getMockImplementation()!;
    getMock.mockImplementation(async (path, params) => {
      if (path.startsWith("/inventory/")) throw new Error("offline");
      return original(path, params);
    });
    await renderCashier();
    await userEvent.click(screen.getByRole("button", { name: "Selecionar produto: Vestido Rosa" }));
    expect(screen.getByText(/Não foi possível consultar o estoque/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tamanho P — indisponível" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adicionar à venda" })).toBeDisabled();
  });

});
