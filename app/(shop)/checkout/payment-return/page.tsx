"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/contexts/language-context";

function PaymentReturnInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [message, setMessage] = useState(t("checkout.paymentReturnBody"));

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }

    const pi = searchParams.get("payment_intent");
    if (!pi) {
      setMessage("Missing payment reference.");
      return;
    }

    let attempts = 0;
    const maxAttempts = 24;

    const poll = async () => {
      try {
        const r = await fetch(
          `/api/orders/lookup-by-payment-intent?payment_intent=${encodeURIComponent(pi)}`
        );
        const data = await r.json();
        if (data?.id) {
          router.replace(`/orders/${data.id}`);
          return;
        }
      } catch {
        /* ignore */
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        setMessage(t("checkout.paymentReturnTimeout"));
        return;
      }
      setTimeout(poll, 1500);
    };

    poll();
  }, [searchParams, session, status, router, t]);

  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-lg">
      <h1 className="text-xl font-semibold mb-4">{t("checkout.paymentReturnTitle")}</h1>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

export default function CheckoutPaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center text-gray-600">Loading…</div>
      }
    >
      <PaymentReturnInner />
    </Suspense>
  );
}
