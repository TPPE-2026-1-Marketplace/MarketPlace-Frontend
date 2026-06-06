import type { CartItem, Cart } from "@/models";

const CART_KEY = "dk_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(CART_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as CartItem[];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function calculateTotals(items: CartItem[], frete = 0, desconto = 0, cupom: string | null = null): Cart {
  const subtotal = items.reduce(
    (sum, item) => sum + item.variant.preco_variante * item.quantity,
    0,
  );

  return {
    items,
    subtotal,
    frete,
    desconto,
    cupom,
    total: Math.max(0, subtotal + frete - desconto),
  };
}

export const CartService = {
  getCart(): Cart {
    const items = loadCart();
    return calculateTotals(items);
  },

  addItem(item: CartItem): Cart {
    const items = loadCart();

    const existingIndex = items.findIndex(
      (i) => i.variant.codigo_sku === item.variant.codigo_sku,
    );

    if (existingIndex >= 0) {
      items[existingIndex].quantity += item.quantity;
    } else {
      items.push(item);
    }

    saveCart(items);
    return calculateTotals(items);
  },

  updateQuantity(codigoSku: string, quantity: number): Cart {
    let items = loadCart();

    if (quantity <= 0) {
      items = items.filter((i) => i.variant.codigo_sku !== codigoSku);
    } else {
      const item = items.find((i) => i.variant.codigo_sku === codigoSku);
      if (item) {
        item.quantity = quantity;
      }
    }

    saveCart(items);
    return calculateTotals(items);
  },

  removeItem(codigoSku: string): Cart {
    const items = loadCart().filter((i) => i.variant.codigo_sku !== codigoSku);
    saveCart(items);
    return calculateTotals(items);
  },

  clear(): Cart {
    saveCart([]);
    return calculateTotals([]);
  },

  getItemCount(): number {
    return loadCart().reduce((sum, item) => sum + item.quantity, 0);
  },
};
