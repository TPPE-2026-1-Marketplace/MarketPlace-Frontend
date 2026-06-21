import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

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

export interface ShippingSelection {
  id: number;
  name: string;
  price: number;
  delivery_time: number;
}

export interface Cart {
  subtotal: number;
  desconto: number;
  total: number;
  id: number;
  items: CartItem[];
  frete?: number;
  cupom?: string | null;
  selectedShipping?: ShippingSelection | null;
}

interface CartContextType {
  cart: Cart;
  addItem: (item: any, quantity?: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeItem: (variantId: number) => void;
  setShipping: (option: ShippingSelection | null) => void;
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
  selectedShipping: null,
};

function calculateCart(cart: Cart): Cart {
  const subtotal = cart.items.reduce((sum, item) => sum + (item.variant.preco_variante || item.variant.produto.preco_base) * item.quantity, 0);
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

  const setShipping = useCallback((option: ShippingSelection | null) => {
    setCart(prev => {
      const frete = option?.price ?? 0;
      return calculateCart({ ...prev, selectedShipping: option, frete });
    });
  }, []);

  const clear = useCallback(() => {
    setCart(EMPTY_CART);
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, removeItem, setShipping, clear, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
