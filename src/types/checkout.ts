/** Tipos compartilhados por carrinho, checkout e confirmação do pedido. */

export type DeliveryMethod = "entrega" | "loja";

/** `boleto` aparece na tela, mas fica desabilitado: o backend ainda não suporta. */
export type PaymentMethod = "credit_card" | "pix" | "boleto";

export interface ShippingQuote {
  valor: number;
  prazo_dias: number;
}

export interface CheckoutForm {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export type CheckoutField = keyof CheckoutForm;

export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export type CheckoutStep = "dados" | "entrega" | "pagamento";

/**
 * Resumo do pedido salvo no navegador antes do redirect para o pagamento.
 * A tela de confirmação o lê no retorno, já que convidados não podem
 * consultar o pedido na API (GET /orders/:id exige login).
 */
export interface OrderSnapshot {
  idPedido: number;
  nome: string;
  email: string;
  itemCount: number;
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  tipoRetirada: DeliveryMethod;
  metodoPagamento: Exclude<PaymentMethod, "boleto">;
  parcelas: number;
  criadoEm: string;
}
