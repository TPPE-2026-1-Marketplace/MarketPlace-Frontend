import { describe, expect, it } from "vitest";
import { MOCK_COUPONS } from "./coupons";
import { MOCK_EMPLOYEE_SALES } from "./employees";
import { MOCK_ORDERS, PRODUCTS } from "./products";

const unique = (values: string[]) => new Set(values).size === values.length;

describe("dados de demonstração", () => {
  it("produtos têm id e SKU únicos e valores válidos", () => {
    expect(unique(PRODUCTS.map((p) => p.id))).toBe(true);
    expect(unique(PRODUCTS.map((p) => p.sku))).toBe(true);
    for (const product of PRODUCTS) {
      expect(product.price).toBeGreaterThan(0);
      if (product.originalPrice) expect(product.originalPrice).toBeGreaterThan(product.price);
      expect(product.sizes.length).toBeGreaterThan(0);
      expect(product.colors.length).toBeGreaterThan(0);
      expect(product.stockEcommerce).toBeGreaterThanOrEqual(0);
      expect(product.stockPhysical).toBeGreaterThanOrEqual(0);
    }
  });

  it("pedidos têm id único e itens com quantidade positiva", () => {
    expect(unique(MOCK_ORDERS.map((o) => o.id))).toBe(true);
    for (const order of MOCK_ORDERS) {
      expect(order.items.length).toBeGreaterThan(0);
      order.items.forEach((i) => expect(i.quantity).toBeGreaterThan(0));
    }
  });

  it("cupons têm código único, período válido e uso dentro do limite", () => {
    expect(unique(MOCK_COUPONS.map((c) => c.code))).toBe(true);
    for (const coupon of MOCK_COUPONS) {
      expect(coupon.startDate <= coupon.endDate).toBe(true);
      expect(coupon.usageCount).toBeLessThanOrEqual(coupon.usageLimit);
      if (coupon.discountType === "percentage") expect(coupon.discountValue).toBeLessThanOrEqual(100);
    }
  });

  it("vendas de funcionários têm id único e comissão menor que o valor", () => {
    expect(unique(MOCK_EMPLOYEE_SALES.map((s) => s.id))).toBe(true);
    MOCK_EMPLOYEE_SALES.forEach((sale) => expect(sale.commission).toBeLessThan(sale.amount));
  });
});
