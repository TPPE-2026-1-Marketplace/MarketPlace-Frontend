import { useMemo } from "react";
import type { OrderSnapshot } from "@/types/checkout";

export const ORDER_SNAPSHOT_KEY = "dk_last_order";
/** Id do último pedido enviado ao gateway (usado por /pedido sem id). */
export const PENDING_ORDER_KEY = "dk_pending_order";

export function saveOrderSnapshot(snapshot: OrderSnapshot): void {
  try {
    localStorage.setItem(ORDER_SNAPSHOT_KEY, JSON.stringify(snapshot));
    localStorage.setItem(PENDING_ORDER_KEY, String(snapshot.idPedido));
  } catch {
    // Armazenamento indisponível (modo privado): a confirmação usa o fallback.
  }
}

/** Lê o snapshot salvo; com `idPedido`, só retorna se for do mesmo pedido. */
export function readOrderSnapshot(idPedido?: string | number | null): OrderSnapshot | null {
  try {
    const raw = localStorage.getItem(ORDER_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OrderSnapshot>;
    if (typeof parsed?.idPedido !== "number") return null;
    if (idPedido != null && String(parsed.idPedido) !== String(idPedido)) return null;
    return parsed as OrderSnapshot;
  } catch {
    return null;
  }
}

export function readPendingOrderId(): string | null {
  try {
    return localStorage.getItem(PENDING_ORDER_KEY);
  } catch {
    return null;
  }
}

export function useOrderSnapshot(idPedido?: string | number | null) {
  return useMemo(() => readOrderSnapshot(idPedido), [idPedido]);
}
