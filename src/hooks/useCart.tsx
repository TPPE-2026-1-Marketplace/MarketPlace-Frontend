import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export interface CartItem {
  id: number;
  variant: {
    codigoSku: string;
    produto: { idProduto: number; titulo: string; precoBase: number };
    precoVariante?: number;
    cor?: string | null;
    tamanho?: string | null;
    images?: Array<{ url: string }>;
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

interface CartContextType {
  cart: Cart;
  addItem: (item: CartItem["variant"], quantity?: number) => void;
  updateQuantity: (codigoSku: string, quantity: number) => void;
  removeItem: (codigoSku: string) => void;
  clear: () => void;
  itemCount: number;
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
  const subtotal = cart.items.reduce(
    (sum, item) =>
      sum + (item.variant.precoVariante ?? item.variant.produto.precoBase) * item.quantity,
    0,
  );
  return {
    ...cart,
    subtotal,
    total: subtotal + (cart.frete || 0) - (cart.desconto || 0)
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCart(): Cart {
  try {
    const saved = localStorage.getItem("cart");
    if (saved) {
      return JSON.parse(saved) as Cart;
    }
  } catch {
    // Corrupt data
  }
  return EMPTY_CART;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(loadCart);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addItem = useCallback((item: CartItem["variant"], quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.items.find(i => i.variant.codigoSku === item.codigoSku);
      const items = existing
        ? prev.items.map(i =>
            i.variant.codigoSku === item.codigoSku
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          )
        : [...prev.items, { id: Date.now(), variant: item, quantity }];
      return calculateCart({ ...prev, items });
    });
  }, []);

  const updateQuantity = useCallback((codigoSku: string, quantity: number) => {
    setCart(prev => {
      const items = quantity <= 0
        ? prev.items.filter(i => i.variant.codigoSku !== codigoSku)
        : prev.items.map(i => i.variant.codigoSku === codigoSku ? { ...i, quantity } : i);
      return calculateCart({ ...prev, items });
    });
  }, []);

  const removeItem = useCallback((codigoSku: string) => {
    setCart(prev => {
      const items = prev.items.filter(i => i.variant.codigoSku !== codigoSku);
      return calculateCart({ ...prev, items });
    });
  }, []);

  const clear = useCallback(() => {
    setCart(EMPTY_CART);
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, removeItem, clear, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
