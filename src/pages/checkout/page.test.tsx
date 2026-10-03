import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { apiRouter } from "@/test/apiRouter";
import { customer, renderWithProviders } from "@/test/render";
import CheckoutPage from "./page";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn() },
}));
const postMock = vi.mocked(api.post);

const viaCep = vi.fn();
const loggedUser = { ...customer, id: "12345678900" };

function seedCart() {
  localStorage.setItem(
    "cart",
    JSON.stringify({
      id: 1,
      subtotal: 200,
      desconto: 20,
      total: 180,
      cupom: "DK10",
      items: [
        {
          id: 1,
          quantity: 2,
          variant: { codigoSku: "ROSA-P", precoVariante: 100, cor: "Rosa", tamanho: "P", produto: { idProduto: 1, titulo: "Vestido Rosa", precoBase: 100 } },
        },
      ],
    }),
  );
}

function mockBackend(overrides: Record<string, unknown> = {}) {
  postMock.mockImplementation(
    apiRouter({
      "/shipping/calculate": { valor: 20, prazo_dias: 3 },
      "/orders": { idPedido: 55 },
      "/payments": { status: "pending", redirectUrl: "https://pay.example/55" },
      ...overrides,
    }) as never,
  );
}

async function fillDados({ email = "convidada@dk.com", cpf = "123.456.789-00" } = {}) {
  const emailInput = screen.getByPlaceholderText("seu@email.com");
  const cpfInput = screen.getByPlaceholderText("000.000.000-00");
  await userEvent.clear(emailInput);
  if (email) await userEvent.type(emailInput, email);
  await userEvent.clear(cpfInput);
  if (cpf) await userEvent.type(cpfInput, cpf);
}

async function fillCep(cep = "70000-000") {
  await userEvent.type(screen.getByPlaceholderText("CEP"), cep);
  // O frete é calculado 500 ms depois de digitar; o botão só habilita com a cotação.
  await waitFor(() => expect(screen.getByRole("button", { name: /Finalizar Pedido/ })).toBeEnabled(), { timeout: 3000 });
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    seedCart();
    postMock.mockReset();
    mockBackend();
    viaCep.mockReset();
    viaCep.mockResolvedValue({ json: async () => ({ logradouro: "SQS 308", bairro: "Asa Sul", localidade: "Brasília", uf: "DF" }) });
    vi.stubGlobal("fetch", viaCep);
  });

  it("valida e-mail e CPF antes de continuar", async () => {
    renderWithProviders(<CheckoutPage />);
    expect(screen.getByText("Comprando como convidado — sem necessidade de conta.")).toBeInTheDocument();

    await fillDados({ email: "", cpf: "" });
    await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));
    expect(screen.getByText("E-mail é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("CPF é obrigatório")).toBeInTheDocument();

    await fillDados({ email: "invalido", cpf: "123" });
    await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));
    expect(screen.getByText("E-mail inválido")).toBeInTheDocument();
    expect(screen.getByText("CPF deve ter 11 dígitos")).toBeInTheDocument();
  });

  it("convidado finaliza o pedido e recebe o link de pagamento", async () => {
    renderWithProviders(<CheckoutPage />);
    await userEvent.type(screen.getByPlaceholderText("Seu nome (opcional)"), "Convidada");
    await userEvent.type(screen.getByPlaceholderText("(61) 9 9999-9999"), "61999990000");
    await fillDados();
    await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));

    await userEvent.click(screen.getByRole("button", { name: /Continuar como Convidado/ }));
    expect(screen.getByRole("heading", { name: "Endereço de Entrega" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Finalizar Pedido/ })).toBeDisabled();

    await fillCep();
    expect(viaCep).toHaveBeenCalledWith("https://viacep.com.br/ws/70000000/json/");
    await waitFor(() => expect(screen.getByPlaceholderText("Rua")).toHaveValue("SQS 308"));
    expect(screen.getByPlaceholderText("Estado")).toHaveValue("DF");
    // Total = 180 (carrinho com cupom) + 20 de frete.
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent(/R\$\s200,00/);
    await userEvent.type(screen.getByPlaceholderText("Número"), "10");

    await userEvent.click(screen.getByRole("button", { name: /Finalizar Pedido/ }));

    expect(await screen.findByText("Pedido registrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir pagamento/ })).toHaveAttribute("href", "https://pay.example/55");
    expect(screen.queryByRole("button", { name: "Ver status" })).not.toBeInTheDocument();
    expect(postMock).toHaveBeenCalledWith("/orders/guest", expect.objectContaining({
      items: [{ variantSku: "ROSA-P", quantidade: 2 }],
      couponNumero: "DK10",
      valorFrete: 20,
      enderecoCep: "70000-000",
      enderecoNumero: "10",
      enderecoEstado: "DF",
      clienteCpfAvulso: "12345678900",
      clienteNomeAvulso: "Convidada",
      clienteTelefone: "61999990000",
    }));
    expect(postMock).toHaveBeenCalledWith("/payments/guest", { idPedido: 55, captureMethod: "pix", installments: 1 });
    expect(localStorage.getItem("dk_pending_order")).toBe("55");
    expect(JSON.parse(localStorage.getItem("cart")!).items).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "Voltar à loja" }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  it("cliente logado tem pagamento confirmado direto", async () => {
    mockBackend({ "/payments": { status: "paid" } });
    renderWithProviders(<CheckoutPage />, { user: loggedUser });
    expect(screen.getByPlaceholderText("seu@email.com")).toHaveValue("cliente@dk.com");

    await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));
    await fillCep();
    await userEvent.click(screen.getByRole("button", { name: /Finalizar Pedido/ }));

    expect(await screen.findByText("Pedido Confirmado!")).toBeInTheDocument();
    expect(screen.getByText("#55")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s200,00/)).toBeInTheDocument();
    expect(postMock).toHaveBeenCalledWith("/orders", expect.not.objectContaining({ clienteCpfAvulso: expect.anything() }));
    expect(postMock).toHaveBeenCalledWith("/payments", expect.objectContaining({ idPedido: 55 }));
    expect(screen.queryByText(/comprou como convidado/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Voltar à Loja" }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  it("cliente logado pode ver o status do pedido pendente", async () => {
    renderWithProviders(<CheckoutPage />, { user: loggedUser });
    await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));
    await fillCep();
    await userEvent.click(screen.getByRole("button", { name: /Finalizar Pedido/ }));

    await userEvent.click(await screen.findByRole("button", { name: "Ver status" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/pedido/55");
  });

  it("convidado pode escolher entrar", async () => {
    renderWithProviders(<CheckoutPage />);
    await fillDados();
    await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));

    await userEvent.click(screen.getByRole("button", { name: /^Entrar$/ }));

    expect(screen.getByTestId("location")).toHaveTextContent("/conta?retorno=checkout");
  });

  it("mostra erros do frete e do CEP", async () => {
    mockBackend({ "/shipping/calculate": () => Promise.reject(new Error("CEP fora da área")) });
    viaCep.mockResolvedValueOnce({ json: async () => ({ erro: true }) });
    renderWithProviders(<CheckoutPage />, { user: loggedUser });
    await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));

    await userEvent.type(screen.getByPlaceholderText("CEP"), "70000000");
    expect(await screen.findByText("CEP fora da área", undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText("CEP não encontrado.")).toBeInTheDocument();

    mockBackend({ "/shipping/calculate": () => Promise.reject("falha") });
    viaCep.mockRejectedValueOnce(new Error("offline"));
    await userEvent.clear(screen.getByPlaceholderText("CEP"));
    await userEvent.type(screen.getByPlaceholderText("CEP"), "71000000");
    expect(await screen.findByText("Não foi possível calcular o frete para este CEP.", undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText("Não foi possível consultar o CEP.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("heading", { name: "Dados Pessoais" })).toBeInTheDocument();
  });

  it("trata falha ao criar o pedido e permite tentar de novo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockBackend({ "/orders": () => Promise.reject(new Error("Estoque insuficiente")) });
    renderWithProviders(<CheckoutPage />, { user: loggedUser });
    await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));
    await fillCep();

    await userEvent.click(screen.getByRole("button", { name: /Finalizar Pedido/ }));
    expect(await screen.findByText("Estoque insuficiente")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ops!" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tentar Novamente" }));
    expect(screen.getByRole("heading", { name: "Endereço de Entrega" })).toBeInTheDocument();
  });

  it("trata falha no pagamento sem recriar o pedido", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockBackend({ "/payments": () => Promise.reject("gateway") });
    renderWithProviders(<CheckoutPage />, { user: loggedUser });
    await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));
    await fillCep();

    await userEvent.click(screen.getByRole("button", { name: /Finalizar Pedido/ }));
    expect(await screen.findByText("Pedido criado, mas o pagamento falhou. Tente novamente.")).toBeInTheDocument();

    mockBackend({ "/payments": { status: "paid" } });
    await userEvent.click(screen.getByRole("button", { name: "Tentar Novamente" }));
    await userEvent.click(screen.getByRole("button", { name: /Finalizar Pedido/ }));
    expect(await screen.findByText("Pedido Confirmado!")).toBeInTheDocument();
    expect(postMock.mock.calls.filter(([path]) => path === "/orders")).toHaveLength(1);
  });
});
