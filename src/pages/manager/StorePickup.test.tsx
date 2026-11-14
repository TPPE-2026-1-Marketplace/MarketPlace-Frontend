import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmOrderPickup,
  fetchManagementOrders,
  fetchPeople,
  type ApiOrder,
} from "@/lib/management";
import { customer, renderWithProviders, superadmin } from "@/test/render";
import { StorePickup } from "./StorePickup";

vi.mock("@/lib/management", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/management")>()),
  fetchManagementOrders: vi.fn(),
  fetchPeople: vi.fn(),
  confirmOrderPickup: vi.fn(),
  fetchOrderVerificationCode: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const fetchOrdersMock = vi.mocked(fetchManagementOrders);
const fetchPeopleMock = vi.mocked(fetchPeople);

const NOW = new Date("2026-10-27T12:00:00");

const baseOrder: Omit<ApiOrder, "idPedido" | "dataPedido" | "tipoRetirada" | "status"> = {
  idUsuario: null,
  subtotal: 200,
  valorFrete: 0,
  valorTotal: "200",
  codigoRastreamento: null,
  items: [
    {
      idItemPedido: 1,
      idVariante: "VESTIDO-ROSA-M",
      quantidade: 2,
      precoUnitario: "100",
    },
  ],
};

const mockOrders: ApiOrder[] = [
  // 1. Pedido loja pago aguardando retirada
  {
    ...baseOrder,
    idPedido: 1047,
    dataPedido: "2026-10-27T10:00:00",
    status: "paid",
    tipoRetirada: "loja",
    idUsuario: "11122233344",
    user: { nome: "Marina Silva" },
    codigoVerificacaoRetirada: "123456",
  },
  // 2. Pedido loja pendente aguardando
  {
    ...baseOrder,
    idPedido: 1048,
    dataPedido: "2026-10-27T09:30:00",
    status: "pending",
    tipoRetirada: "loja",
    clienteNomeAvulso: "Beatriz Oliveira",
    clienteEmailAvulso: "beatriz@email.com",
    codigoVerificacaoRetirada: "654321",
  },
  // 3. Pedido loja entregue hoje
  {
    ...baseOrder,
    idPedido: 1045,
    dataPedido: "2026-10-27T08:00:00",
    status: "delivered",
    tipoRetirada: "loja",
    clienteNomeAvulso: "Carla Santos",
    codigoVerificacaoRetirada: "111111",
  },
  // 4. Pedido loja entregue no mês passado (não é de hoje)
  {
    ...baseOrder,
    idPedido: 1010,
    dataPedido: "2026-09-15T14:00:00",
    status: "delivered",
    tipoRetirada: "loja",
    clienteNomeAvulso: "Daniela Ramos",
    codigoVerificacaoRetirada: "222222",
  },
  // 5. Pedido entrega (deve ser ignorado na retirada)
  {
    ...baseOrder,
    idPedido: 9999,
    dataPedido: "2026-10-27T11:00:00",
    status: "paid",
    tipoRetirada: "entrega",
  },
  // 6. Pedido com funcionário (venda PDV, deve ser ignorado na retirada em loja)
  {
    ...baseOrder,
    idPedido: 8888,
    dataPedido: "2026-10-27T11:00:00",
    status: "paid",
    tipoRetirada: "loja",
    idFuncionario: "55566677788",
  },
];

const mockPeople = [
  {
    cpf: "11122233344",
    nome: "Marina Silva",
    email: "marina@dk.com",
    telefone: "61999998888",
  },
];

const rows = () => screen.getAllByRole("row").slice(1);
const kpi = (label: string) => screen.getByText(label, { selector: "p" }).nextElementSibling;
const dialog = () => within(screen.getByRole("dialog"));

async function renderPickup(user = superadmin) {
  renderWithProviders(<StorePickup now={NOW} />, { user });
  await screen.findByRole("heading", { level: 1, name: "Retirada em loja" });
}

describe("StorePickup", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchOrdersMock.mockResolvedValue({
      data: mockOrders,
      meta: { page: 1, limit: 100, total: mockOrders.length, totalPages: 1 },
    });
    fetchPeopleMock.mockResolvedValue({
      data: mockPeople,
      meta: { page: 1, limit: 100, total: mockPeople.length, totalPages: 1 },
    });
    vi.mocked(confirmOrderPickup).mockImplementation(async (_id, pin) => {
      if (pin !== "123456") {
        throw new Error("PIN incorreto");
      }
      return {} as unknown as ApiOrder;
    });
  });

  it("bloqueia quem não é funcionário sem chamar a API", () => {
    renderWithProviders(<StorePickup now={NOW} />, { user: customer });

    expect(
      screen.getByText("Apenas funcionários autorizados podem gerenciar retiradas em loja."),
    ).toBeInTheDocument();
    expect(fetchOrdersMock).not.toHaveBeenCalled();
  });

  it("lista os pedidos para retirada com indicadores e situação", async () => {
    await renderPickup();

    expect(kpi("Aguardando retirada")).toHaveTextContent("02");
    expect(kpi("Retirados hoje")).toHaveTextContent("01");

    // Apenas os 4 pedidos de retirada em loja devem aparecer
    expect(rows()).toHaveLength(4);
    expect(screen.queryByText("#9999")).not.toBeInTheDocument();
    expect(screen.queryByText("#8888")).not.toBeInTheDocument();

    const first = rows()[0];
    expect(first).toHaveTextContent("#1047");
    expect(first).toHaveTextContent("Marina Silva");
    expect(first).toHaveTextContent("2");
    expect(first).toHaveTextContent("R$ 200,00");
    expect(first).toHaveTextContent("Pronto para retirar");
    expect(
      within(first).getByRole("button", { name: "Iniciar retirada do pedido #1047" }),
    ).toBeInTheDocument();

    const deliveredRow = rows()[2];
    expect(deliveredRow).toHaveTextContent("#1045");
    expect(deliveredRow).toHaveTextContent("Retirado");
    expect(
      within(deliveredRow).getByRole("button", { name: "Pedido #1045 retirado" }),
    ).toBeDisabled();

    expect(screen.getByText("Acesso conforme o perfil do usuário")).toBeInTheDocument();
  });

  it("filtra por pedido, nome ou e-mail e limpa os filtros", async () => {
    await renderPickup();

    const searchInput = screen.getByLabelText("Buscar pedido, nome ou e-mail");
    await userEvent.type(searchInput, "Beatriz");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent("#1048");
    expect(rows()[0]).toHaveTextContent("Beatriz Oliveira");

    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, "marina@dk.com");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent("#1047");

    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, "inexistente");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(rows()).toHaveLength(4);
  });

  it("'Buscar retirada' foca o campo de busca", async () => {
    await renderPickup();

    await userEvent.click(screen.getByRole("button", { name: "Buscar retirada" }));
    expect(screen.getByLabelText("Buscar pedido, nome ou e-mail")).toHaveFocus();
  });

  it("Passo 1 exibe os detalhes do pedido e avança para o Passo 2 ao clicar em 'Enviar código 2FA'", async () => {
    await renderPickup();

    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar retirada do pedido #1047" }),
    );

    expect(
      dialog().getByRole("heading", { name: "1 · Conferir pedido #1047" }),
    ).toBeInTheDocument();
    expect(dialog().getByText("Marina Silva")).toBeInTheDocument();
    expect(dialog().getByText("#1047")).toBeInTheDocument();
    expect(dialog().getByText("VESTIDO-ROSA-M · 2 unidades")).toBeInTheDocument();
    expect(dialog().getByText("Confirmado")).toBeInTheDocument();
    expect(dialog().getByText("R$ 200,00")).toBeInTheDocument();

    await userEvent.click(dialog().getByRole("button", { name: "Enviar código 2FA" }));

    expect(
      dialog().getByRole("heading", { name: "2 · Validar código de retirada" }),
    ).toBeInTheDocument();
    expect(dialog().getByText("#1047 · Marina Silva")).toBeInTheDocument();
    expect(
      dialog().getByText("E-mail cadastrado da cliente (marina@dk.com)"),
    ).toBeInTheDocument();
    expect(dialog().getByLabelText("Código 2FA *")).toBeInTheDocument();
  });

  it("Passo 2 valida código de 6 dígitos e permite reenviar código", async () => {
    await renderPickup();

    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar retirada do pedido #1047" }),
    );
    await userEvent.click(dialog().getByRole("button", { name: "Enviar código 2FA" }));

    const codeInput = dialog().getByLabelText("Código 2FA *");
    await userEvent.type(codeInput, "123");
    await userEvent.click(
      dialog().getByRole("button", { name: "Validar e confirmar retirada" }),
    );

    expect(
      dialog().getByText("O código 2FA deve conter exatamente 6 dígitos."),
    ).toBeInTheDocument();

    await userEvent.click(dialog().getByRole("button", { name: "Reenviar código" }));
    expect(
      dialog().getByText("Novo código enviado para o e-mail cadastrado."),
    ).toBeInTheDocument();
    expect(codeInput).toHaveValue("");
  });

  it("exibe o estado 'Código inválido' quando o PIN informado não confere e permite tentar novamente", async () => {
    await renderPickup();

    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar retirada do pedido #1047" }),
    );
    await userEvent.click(dialog().getByRole("button", { name: "Enviar código 2FA" }));

    const codeInput = dialog().getByLabelText("Código 2FA *");
    await userEvent.type(codeInput, "999999");
    await userEvent.click(
      dialog().getByRole("button", { name: "Validar e confirmar retirada" }),
    );

    expect(dialog().getByRole("heading", { name: "Código inválido" })).toBeInTheDocument();
    expect(dialog().getByText("O código informado não confere")).toBeInTheDocument();
    expect(dialog().getByText("Informe os 6 dígitos novamente")).toBeInTheDocument();

    await userEvent.click(dialog().getByRole("button", { name: "Tentar novamente" }));
    expect(
      dialog().getByRole("heading", { name: "2 · Validar código de retirada" }),
    ).toBeInTheDocument();
    expect(dialog().getByLabelText("Código 2FA *")).toHaveValue("");
  });

  it("confirma a retirada com código correto e exibe a tela 'Retirada concluída' atualizando o status", async () => {
    await renderPickup();

    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar retirada do pedido #1047" }),
    );
    await userEvent.click(dialog().getByRole("button", { name: "Enviar código 2FA" }));

    const codeInput = dialog().getByLabelText("Código 2FA *");
    await userEvent.type(codeInput, "123456");
    await userEvent.click(
      dialog().getByRole("button", { name: "Validar e confirmar retirada" }),
    );

    expect(dialog().getByRole("heading", { name: "Retirada concluída" })).toBeInTheDocument();
    expect(dialog().getByText("Código confirmado")).toBeInTheDocument();
    expect(dialog().getByText("Produtos liberados para a cliente")).toBeInTheDocument();

    await userEvent.click(dialog().getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // Indicadores e situação devem estar atualizados
    expect(kpi("Aguardando retirada")).toHaveTextContent("01");
    expect(kpi("Retirados hoje")).toHaveTextContent("02");
    expect(rows()[0]).toHaveTextContent("Retirado");
  });

  it("mostra estado de erro e permite tentar novamente", async () => {
    fetchOrdersMock.mockRejectedValueOnce(new Error("500"));
    renderWithProviders(<StorePickup now={NOW} />, { user: superadmin });

    expect(
      await screen.findByText("Não foi possível carregar os pedidos de retirada."),
    ).toBeInTheDocument();

    fetchOrdersMock.mockResolvedValueOnce({
      data: mockOrders,
      meta: { page: 1, limit: 100, total: mockOrders.length, totalPages: 1 },
    });

    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("#1047")).toBeInTheDocument();
  });
});
