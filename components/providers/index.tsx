"use client";

import { AuthProvider } from "@/components/providers/auth";
import { CartProvider } from "@/components/providers/cart";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
