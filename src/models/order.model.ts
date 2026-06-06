/** Order types matching the backend entity structure */

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";
export type OrderType = "entrega" | "loja";
export type PaymentMethod = "pix" | "credit_card" | "debit_card";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Order {
  id_pedido: number;
  id_usuario: string | null;
  id_cupom: string | null;
  data_pedido: string;
  status: OrderStatus;
  subtotal: number;
  valor_frete: number;
  valor_total: number;
  tipo_retirada: OrderType;
  codigo_verificacao_retirada: string | null;
  codigo_rastreamento: string | null;
  items: OrderItem[];
  payment?: Payment;
}

export interface OrderItem {
  id_item_pedido: number;
  id_pedido: number;
  codigo_sku: string;
  quantidade: number;
  preco_unitario: number;
}

export interface Payment {
  id_pagamento: number;
  id_pedido: number;
  amount: number;
  paid_amount: number | null;
  installments: number;
  capture_method: PaymentMethod;
  status: PaymentStatus;
  receipt_url: string | null;
  created_at: string;
}

export interface CreateOrderRequest {
  items: {
    codigo_sku: string;
    quantidade: number;
  }[];
  tipo_retirada: OrderType;
  id_cupom?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
}
