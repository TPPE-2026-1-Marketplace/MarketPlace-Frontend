import { useState, useCallback, useEffect } from "react";

export interface CartItem {
  id: number;
  variant: {
    id: number;
    produto: { id: number; titulo: string; preco_base: number };
    preco_variante?: number;
    cor?: string;
    tamanho?: string;
    images?: { image: { url: string } }[];
  };
  quantity: number;
}

export interface Cart {
  subtotal: number;
  desconto: number;
  total: number;
  id: number;
  items: CartItem[];
  frete?: number;
  cupom?: string | null;
}

const EMPTY_CART: Cart = {
  id: 1,
  items: [],
  subtotal: 0,
  frete: 0,
  desconto: 0,
  cupom: null,
  total: 0,
};

function calculateCart(cart: Cart): Cart {
  const subtotal = cart.items.reduce((sum, item) => sum + (item.variant.preco_variante || item.variant.produto.preco_base) * item.quantity, 0);
  return {
    ...cart,
    subtotal,
    total: subtotal + (cart.frete || 0) - (cart.desconto || 0)
  };
}

export function useCart() {
  const [cart, setCart] = useState<Cart>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("cart") : null;
    if (!saved) return EMPTY_CART;
    try {
      return JSON.parse(saved) as Cart;
    } catch {
      // Corrupt/legacy data — discard it instead of crashing on mount
      return EMPTY_CART;
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addItem = useCallback((item: any, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.items.find(i => i.variant.id === item.id);
      const items = existing
        ? prev.items.map(i => i.variant.id === item.id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev.items, { id: Date.now(), variant: item, quantity }];
      return calculateCart({ ...prev, items });
    });
  }, []);

  const updateQuantity = useCallback((variantId: number, quantity: number) => {
    setCart(prev => {
      const items = quantity <= 0
        ? prev.items.filter(i => i.variant.id !== variantId)
        : prev.items.map(i => i.variant.id === variantId ? { ...i, quantity } : i);
      return calculateCart({ ...prev, items });
    });
  }, []);

  const removeItem = useCallback((variantId: number) => {
    setCart(prev => {
      const items = prev.items.filter(i => i.variant.id !== variantId);
      return calculateCart({ ...prev, items });
    });
  }, []);

  const clear = useCallback(() => {
    setCart(EMPTY_CART);
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    itemCount,
  };
}
