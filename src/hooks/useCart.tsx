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
  cupomPercentual?: number;
  cupomFixo?: number;
}

interface CartContextType {
  cart: Cart;
  addItem: (item: CartItem["variant"], quantity?: number) => void;
  updateQuantity: (codigoSku: string, quantity: number) => void;
  removeItem: (codigoSku: string) => void;
  clear: () => void;
  applyCoupon: (numero: string | null, descontoPercentual?: number, descontoFixo?: number) => void;
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
  cupomPercentual: 0,
  cupomFixo: 0,
};

function calculateCart(cart: Cart & { cupomPercentual?: number; cupomFixo?: number }): Cart {
  const subtotal = cart.items.reduce(
    (sum, item) =>
      sum + (item.variant.precoVariante ?? item.variant.produto.precoBase) * item.quantity,
    0,
  );
  
  let desconto = 0;
  if (cart.cupomPercentual) {
    desconto = subtotal * (cart.cupomPercentual / 100);
  } else if (cart.cupomFixo) {
    desconto = Math.min(cart.cupomFixo, subtotal);
  }

  return {
    ...cart,
    subtotal,
    desconto,
    total: Math.max(0, subtotal + (cart.frete || 0) - desconto)
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

  useEffect(() => {
    const handleClearCart = () => clear();
    window.addEventListener("clear-cart", handleClearCart);
    return () => window.removeEventListener("clear-cart", handleClearCart);
  }, [clear]);

  const applyCoupon = useCallback((numero: string | null, percentual: number = 0, fixo: number = 0) => {
    setCart(prev => {
      const updated = { ...prev, cupom: numero, cupomPercentual: percentual, cupomFixo: fixo };
      return calculateCart(updated as any);
    });
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, removeItem, clear, applyCoupon, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
