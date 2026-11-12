import type { ApiCoupon } from "@/hooks/useManagementCoupons";

export type CouponStatus = "active" | "inactive" | "expired";

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  expired: "Expirado",
};

/** Ativo no cadastro mas com a data fim no passado conta como expirado. */
export function couponStatus(coupon: ApiCoupon, now: Date): CouponStatus {
  if (!coupon.ativo) return "inactive";
  return new Date(coupon.dataFim).getTime() < now.getTime() ? "expired" : "active";
}

/** "10%" ou "R$ 50,00". */
export function formatDiscount(coupon: ApiCoupon): string {
  const value = Number(coupon.valorDesconto);
  return coupon.tipoCupom === "porcentagem"
    ? `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`
    : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "80 / 200", ou "80 / sem limite". */
export function formatCouponUsage(coupon: ApiCoupon): string {
  return `${coupon.usosAtuais} / ${coupon.usoMaximo ?? "sem limite"}`;
}
