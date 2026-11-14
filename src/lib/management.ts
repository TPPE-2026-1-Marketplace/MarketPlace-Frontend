import { api, type PaginatedResponse } from "@/lib/api";

export type ApiOrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";
export type ApiPickupType = "entrega" | "loja";

export interface ApiOrderItem {
  idItemPedido: number;
  idVariante: string;
  quantidade: number;
  precoUnitario: number | string;
}

export interface ApiOrder {
  idPedido: number;
  idUsuario: string | null;
  clienteNomeAvulso?: string | null;
  clienteCpfAvulso?: string | null;
  clienteEmailAvulso?: string | null;
  idFuncionario?: string | null;
  user?: {
    nome: string;
    email?: string | null;
  };
  /** Vendedor da venda presencial (GET /orders traz `employee.person`). */
  employee?: {
    cpf: string;
    codigo_funcionario: string | null;
    person?: { nome: string } | null;
  } | null;
  dataPedido: string;
  status: ApiOrderStatus;
  subtotal: number | string;
  valorFrete: number | string;
  valorTotal: number | string;
  tipoRetirada: ApiPickupType;
  codigoVerificacaoRetirada?: string | null;
  codigoRastreamento: string | null;
  items: ApiOrderItem[];
}

export interface ApiPerson {
  cpf: string;
  nome: string;
  email: string;
  telefone: string | null;
}

export const ORDER_STATUS_LABELS: Record<ApiOrderStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const fetchManagementOrders = () =>
  api.get<PaginatedResponse<ApiOrder>>("/orders", { page: 1, limit: 100 });

export const fetchPeople = () =>
  api.get<PaginatedResponse<ApiPerson>>("/people", { page: 1, limit: 100 });

export const fetchOrderVerificationCode = (idPedido: number) =>
  api.get<{ codigoVerificacaoRetirada: string }>(`/orders/${idPedido}/verification-code`);

export const confirmOrderPickup = (idPedido: number, pin: string) =>
  api.post<ApiOrder>(`/orders/${idPedido}/confirm-pickup`, { pin });

export const PICKUP_TYPE_LABELS: Record<ApiPickupType, string> = {
  entrega: "Entrega",
  loja: "Loja",
};

/** Nome exibido do cliente: o do cadastro ou o informado na venda avulsa. */
export function orderCustomerName(order: ApiOrder): string {
  return order.user?.nome || order.clienteNomeAvulso || "Cliente não identificado";
}

/** CPF do cliente do pedido (cadastrado ou avulso), quando houver. */
export function orderCustomerCpf(order: ApiOrder): string | null {
  return order.idUsuario || order.clienteCpfAvulso || null;
}

/** E-mail do cliente do pedido (cadastrado ou informado na compra avulsa). */
export function orderCustomerEmail(order: ApiOrder, peopleMap?: Map<string, ApiPerson>): string | null {
  if (order.user?.email) return order.user.email;
  if (order.clienteEmailAvulso) return order.clienteEmailAvulso;
  if (order.idUsuario && peopleMap) {
    return peopleMap.get(order.idUsuario)?.email ?? null;
  }
  return null;
}
