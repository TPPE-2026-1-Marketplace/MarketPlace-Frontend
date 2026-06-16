import React, { createContext, useContext, useState, ReactNode } from "react";
import { POSSale, POSSaleItem } from "../data/pos-types";

interface POSContextType {
  currentSale: POSSaleItem[];
  sales: POSSale[];
  addItem: (item: POSSaleItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearSale: () => void;
  completeSale: (
    paymentMethod: "pix" | "card",
    sellerId: string,
    sellerName: string,
    customerName?: string,
    customerPhone?: string,
    customerEmail?: string
  ) => { success: boolean; saleId?: string };
  getSalesBySeller: (sellerId: string) => POSSale[];
  getTotalSales: () => number;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [currentSale, setCurrentSale] = useState<POSSaleItem[]>([]);
  const [sales, setSales] = useState<POSSale[]>([]);

  const addItem = (item: POSSaleItem) => {
    const existingIndex = currentSale.findIndex(
      (i) =>
        i.product.id === item.product.id &&
        i.size === item.size &&
        i.color === item.color
    );

    if (existingIndex >= 0) {
      const updated = [...currentSale];
      updated[existingIndex].quantity += item.quantity;
      setCurrentSale(updated);
    } else {
      setCurrentSale([...currentSale, item]);
    }
  };

  const removeItem = (index: number) => {
    setCurrentSale(currentSale.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    const updated = [...currentSale];
    updated[index].quantity = quantity;
    setCurrentSale(updated);
  };

  const clearSale = () => {
    setCurrentSale([]);
  };

  const completeSale = (
    paymentMethod: "pix" | "card",
    sellerId: string,
    sellerName: string,
    customerName?: string,
    customerPhone?: string,
    customerEmail?: string
  ) => {
    if (currentSale.length === 0) {
      return { success: false };
    }

    const subtotal = currentSale.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const newSale: POSSale = {
      id: `pos-${Date.now()}`,
      items: [...currentSale],
      subtotal,
      total: subtotal,
      paymentMethod,
      sellerId,
      sellerName,
      customerName,
      customerPhone,
      customerEmail,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
    };

    setSales([newSale, ...sales]);
    setCurrentSale([]);

    return { success: true, saleId: newSale.id };
  };

  const getSalesBySeller = (sellerId: string) => {
    return sales.filter((sale) => sale.sellerId === sellerId);
  };

  const getTotalSales = () => {
    return sales.reduce((sum, sale) => sum + sale.total, 0);
  };

  return (
    <POSContext.Provider
      value={{
        currentSale,
        sales,
        addItem,
        removeItem,
        updateQuantity,
        clearSale,
        completeSale,
        getSalesBySeller,
        getTotalSales,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error("usePOS must be used within POSProvider");
  return ctx;
}
