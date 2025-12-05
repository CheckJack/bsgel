"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page with register mode
    router.replace("/login?mode=register");
  }, [router]);

  return null;
}
