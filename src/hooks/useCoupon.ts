import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { useCart } from "@/hooks/useCart";

interface CouponValidation {
  valid: boolean;
  reason?: "invalid" | "expired" | "limit_reached" | "ineligible_products";
  tipoCupom?: string;
  valorDesconto?: number;
}

const REASON_MESSAGES: Record<string, string> = {
  expired: "Cupom expirado.",
  limit_reached: "Limite de uso atingido.",
  ineligible_products: "Cupom não aplicável a estes produtos.",
};

export const INVALID_COUPON_MESSAGE = "Cupom inválido ou expirado.";
export const COUPON_REQUEST_ERROR = "Erro ao validar cupom. Tente novamente.";

export function getCouponErrorMessage(reason?: string): string {
  return (reason && REASON_MESSAGES[reason]) || INVALID_COUPON_MESSAGE;
}

/** Valida o cupom na API (GET /coupons/validate/:numero) e aplica no carrinho. */
export function useCoupon() {
  const { cart, applyCoupon } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(
    async (code: string): Promise<boolean> => {
      const numero = code.trim().toUpperCase();
      if (!numero) {
        setError("Digite o código do cupom.");
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        const productIds = Array.from(
          new Set(cart.items.map((item) => item.variant.produto.idProduto)),
        ).join(",");
        const res = await api.get<CouponValidation>(
          `/coupons/validate/${encodeURIComponent(numero)}`,
          { productIds },
        );

        if (!res.valid) {
          setError(getCouponErrorMessage(res.reason));
          return false;
        }

        if (res.tipoCupom === "porcentagem") {
          applyCoupon(numero, res.valorDesconto ?? 0, 0);
        } else {
          applyCoupon(numero, 0, res.valorDesconto ?? 0);
        }
        return true;
      } catch {
        setError(COUPON_REQUEST_ERROR);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [cart.items, applyCoupon],
  );

  const remove = useCallback(() => {
    applyCoupon(null, 0, 0);
    setError(null);
  }, [applyCoupon]);

  const clearError = useCallback(() => setError(null), []);

  return {
    appliedCode: cart.cupom ?? null,
    discount: cart.desconto,
    apply,
    remove,
    loading,
    error,
    clearError,
  };
}
