"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { HomepageProductsPayload } from "@/lib/homepage/get-homepage-products";

export type HomepageProductSection = keyof HomepageProductsPayload;

type HomepageProductsContextValue = {
  data: HomepageProductsPayload | null;
  isLoading: boolean;
  error: boolean;
};

const HomepageProductsContext = createContext<HomepageProductsContextValue>({
  data: null,
  isLoading: true,
  error: false,
});

export function HomepageProductsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<HomepageProductsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/homepage/products");
        if (!res.ok) throw new Error("homepage products fetch failed");
        const payload = (await res.json()) as HomepageProductsPayload;
        if (!cancelled) setData(payload);
      } catch (err) {
        console.error("Failed to load homepage products:", err);
        if (!cancelled) {
          setData({ featured: [], spa: [], bases: [], utensils: [] });
          setError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ data, isLoading, error }),
    [data, isLoading, error]
  );

  return (
    <HomepageProductsContext.Provider value={value}>
      {children}
    </HomepageProductsContext.Provider>
  );
}

export function useHomepageProducts(section: HomepageProductSection) {
  const { data, isLoading, error } = useContext(HomepageProductsContext);
  return {
    products: data?.[section] ?? [],
    isLoading,
    error,
  };
}
