import type { ApiOrder } from "@/lib/management";

/** "#PDV-084", como no protótipo. */
export function formatPosSaleId(idPedido: number): string {
  return `#PDV-${String(idPedido).padStart(3, "0")}`;
}

/** Vendedor da venda: nome do cadastro, ou o CPF quando a API não traz o funcionário. */
export function posSellerName(sale: ApiOrder): string {
  return sale.employee?.person?.nome || sale.idFuncionario || "Vendedor não identificado";
}

/** O PDV não grava a forma de pagamento: POST /orders/in-store não recebe esse campo. */
export const POS_PAYMENT_NOT_RECORDED = "Não registrado";
