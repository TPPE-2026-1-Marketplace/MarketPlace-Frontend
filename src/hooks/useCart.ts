"use client";

import { useState, useEffect, useCallback } from "react";
import { CartService } from "@/services";
import type { Cart, CartItem } from "@/models";

const EMPTY_CART: Cart = {
  items: [],
  subtotal: 0,
  frete: 0,
  desconto: 0,
  cupom: null,
  total: 0,
};

export function useCart() {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);

  useEffect(() => {
    setCart(CartService.getCart());
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setCart(CartService.addItem(item));
  }, []);

  const updateQuantity = useCallback((codigoSku: string, quantity: number) => {
    setCart(CartService.updateQuantity(codigoSku, quantity));
  }, []);

  const removeItem = useCallback((codigoSku: string) => {
    setCart(CartService.removeItem(codigoSku));
  }, []);

  const clear = useCallback(() => {
    setCart(CartService.clear());
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
