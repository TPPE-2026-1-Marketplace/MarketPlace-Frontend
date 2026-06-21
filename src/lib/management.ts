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
  dataPedido: string;
  status: ApiOrderStatus;
  subtotal: number | string;
  valorFrete: number | string;
  valorTotal: number | string;
  tipoRetirada: ApiPickupType;
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
