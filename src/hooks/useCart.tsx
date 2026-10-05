import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { roundCents } from "@/lib/utils";

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
  /** CEP usado na última cotação de frete (só dígitos). */
  cep?: string | null;
  prazoDias?: number | null;
  cupom?: string | null;
  cupomPercentual?: number;
  cupomFixo?: number;
}

export interface CartShipping {
  cep: string;
  valor: number;
  prazoDias: number;
}

interface CartContextType {
  cart: Cart;
  addItem: (item: CartItem["variant"], quantity?: number) => void;
  updateQuantity: (codigoSku: string, quantity: number) => void;
  removeItem: (codigoSku: string) => void;
  clear: () => void;
  applyCoupon: (numero: string | null, descontoPercentual?: number, descontoFixo?: number) => void;
  /** Guarda a cotação de frete (ou remove, com `null`); o valor entra no total. */
  setShipping: (shipping: CartShipping | null) => void;
  itemCount: number;
}

const EMPTY_CART: Cart = {
  id: 1,
  items: [],
  subtotal: 0,
  frete: 0,
  cep: null,
  prazoDias: null,
  desconto: 0,
  cupom: null,
  total: 0,
  cupomPercentual: 0,
  cupomFixo: 0,
};

function getUnitPrice(item: CartItem): number {
  return item.variant.precoVariante ?? item.variant.produto.precoBase;
}

export function calculateCart(cart: Cart): Cart {
  const subtotal = roundCents(
    cart.items.reduce((sum, item) => sum + getUnitPrice(item) * item.quantity, 0),
  );

  let desconto = 0;
  if (cart.cupomPercentual) {
    desconto = roundCents(subtotal * (cart.cupomPercentual / 100));
  } else if (cart.cupomFixo) {
    desconto = Math.min(cart.cupomFixo, subtotal);
  }

  // Sem itens não há o que entregar: o frete guardado não entra no total.
  const frete = cart.items.length > 0 ? cart.frete || 0 : 0;

  return {
    ...cart,
    subtotal,
    desconto,
    total: roundCents(Math.max(0, subtotal + frete - desconto)),
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCart(): Cart {
  try {
    const saved = localStorage.getItem("cart");
    if (saved) {
      // Carrinhos salvos antes da cotação de frete não têm cep/prazoDias.
      return calculateCart({ ...EMPTY_CART, ...(JSON.parse(saved) as Partial<Cart>) });
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
    setCart(prev => calculateCart({ ...prev, cupom: numero, cupomPercentual: percentual, cupomFixo: fixo }));
  }, []);

  const setShipping = useCallback((shipping: CartShipping | null) => {
    setCart(prev =>
      calculateCart({
        ...prev,
        cep: shipping?.cep ?? null,
        frete: shipping?.valor ?? 0,
        prazoDias: shipping?.prazoDias ?? null,
      }),
    );
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, removeItem, clear, applyCoupon, setShipping, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
