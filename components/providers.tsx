"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/contexts/cart-context";
import { LanguageProvider } from "@/contexts/language-context";
import { ToastContainer } from "@/components/ui/toast";
import { CartStockToastBridge } from "@/components/stock/cart-stock-toast-bridge";
import { IosViewportSync } from "@/components/layout/ios-viewport-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <LanguageProvider>
          <CartProvider>
            <IosViewportSync />
            <CartStockToastBridge />
            {children}
            <ToastContainer />
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

