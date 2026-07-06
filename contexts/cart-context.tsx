"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { parseCartStockResponse } from "@/lib/stock-client";
import { useLanguage } from "@/contexts/language-context";
import { toast } from "@/components/ui/toast";

interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: string;
    image: string | null;
    description: string | null;
    categoryId: string | null;
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  quantity: number;
}

interface CartTrainingItem {
  id: string;
  sessionId: string;
  bookingId: string | null;
  program: {
    id: string;
    title: string;
    price: string;
    image: string | null;
  };
  session: {
    id: string;
    startDate: string;
    endDate: string;
    location: string | null;
    format: string;
  };
}

interface CartContextType {
  items: CartItem[];
  trainingItems: CartTrainingItem[];
  itemCount: number;
  isLoading: boolean;
  addItem: (productId: string, quantity: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<boolean>;
  removeTrainingItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [items, setItems] = useState<CartItem[]>([]);
  const [trainingItems, setTrainingItems] = useState<CartTrainingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const cartFetchGenerationRef = useRef(0);

  const fetchCart = async () => {
    if (!session) {
      setItems([]);
      setTrainingItems([]);
      setIsLoading(false);
      return;
    }

    const generation = ++cartFetchGenerationRef.current;

    try {
      const res = await fetch("/api/cart");
      if (generation !== cartFetchGenerationRef.current) {
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTrainingItems(data.trainingItems || []);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      if (generation === cartFetchGenerationRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCart();
  }, [session?.user?.id]); // Only refetch when user ID changes, not on every session update

  const addItem = async (productId: string, quantity: number): Promise<boolean> => {
    if (!session) {
      return false;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      const partialLabel = t("stock.partialAdded");
      const result = await parseCartStockResponse(res, partialLabel);
      if (result === "ok" || result === "partial") {
        await fetchCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to add item:", error);
      return false;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (res.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const removeItem = async (itemId: string): Promise<boolean> => {
    const generation = ++cartFetchGenerationRef.current;
    let previousItems: CartItem[] = [];

    setItems((current) => {
      previousItems = current;
      return current.filter((item) => item.id !== itemId);
    });

    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        if (generation === cartFetchGenerationRef.current) {
          setItems(previousItems);
        }
        toast(t("cart.removeFailed"), "error");
        return false;
      }

      await fetchCart();
      return true;
    } catch (error) {
      console.error("Failed to remove item:", error);
      if (generation === cartFetchGenerationRef.current) {
        setItems(previousItems);
      }
      toast(t("cart.removeFailed"), "error");
      return false;
    }
  };

  const removeTrainingItem = async (itemId: string): Promise<boolean> => {
    const generation = ++cartFetchGenerationRef.current;
    let previousTrainingItems: CartTrainingItem[] = [];

    setTrainingItems((current) => {
      previousTrainingItems = current;
      return current.filter((item) => item.id !== itemId);
    });

    try {
      const res = await fetch(`/api/cart/training/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        if (generation === cartFetchGenerationRef.current) {
          setTrainingItems(previousTrainingItems);
        }
        toast(t("cart.removeFailed"), "error");
        return false;
      }

      await fetchCart();
      return true;
    } catch (error) {
      console.error("Failed to remove training item:", error);
      if (generation === cartFetchGenerationRef.current) {
        setTrainingItems(previousTrainingItems);
      }
      toast(t("cart.removeFailed"), "error");
      return false;
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (res.ok) {
        setItems([]);
        setTrainingItems([]);
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const itemCount =
    items.reduce((sum, item) => sum + item.quantity, 0) + trainingItems.length;

  return (
    <CartContext.Provider
      value={{
        items,
        trainingItems,
        itemCount,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        removeTrainingItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

