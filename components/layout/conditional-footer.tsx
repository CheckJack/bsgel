"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  
  // Hide footer on auth routes (login, register)
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }
  
  // Hide footer on diagnosis page
  if (pathname === "/diagnosis") {
    return null;
  }
  
  return <Footer />;
}

