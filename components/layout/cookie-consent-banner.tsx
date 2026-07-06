"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import {
  acceptAllCookies,
  hasStoredConsent,
  rejectOptionalCookies,
} from "@/lib/cookie-consent";
import {
  HOME_ENTRY_LOADER_COMPLETE_EVENT,
  releaseHomeScrollLock,
} from "@/lib/home-entry-loader";
import { cn } from "@/lib/utils";

export function CookieConsentBanner() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mounted, setMounted] = useState(false);
  const [hasConsentChoice, setHasConsentChoice] = useState(() => hasStoredConsent());
  const [entryLoaderComplete, setEntryLoaderComplete] = useState(!isHome);

  useEffect(() => {
    setMounted(true);
    setHasConsentChoice(hasStoredConsent());
  }, []);

  useEffect(() => {
    if (!isHome) {
      setEntryLoaderComplete(true);
      return;
    }

    setEntryLoaderComplete(false);

    const onLoaderComplete = () => setEntryLoaderComplete(true);
    window.addEventListener(HOME_ENTRY_LOADER_COMPLETE_EVENT, onLoaderComplete);
    return () => window.removeEventListener(HOME_ENTRY_LOADER_COMPLETE_EVENT, onLoaderComplete);
  }, [isHome]);

  const hiddenRoute =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/salons";

  const visible = mounted && !hiddenRoute && !hasConsentChoice && entryLoaderComplete;

  useEffect(() => {
    if (!visible) {
      document.body.removeAttribute("data-cookie-banner-open");
      return;
    }

    document.body.setAttribute("data-cookie-banner-open", "true");
    releaseHomeScrollLock();

    return () => {
      document.body.removeAttribute("data-cookie-banner-open");
    };
  }, [visible]);

  const dismiss = useCallback((choice: "accept" | "reject") => {
    if (choice === "accept") {
      acceptAllCookies();
    } else {
      rejectOptionalCookies();
    }
    setHasConsentChoice(true);
  }, []);

  const handleAccept = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dismiss("accept");
    },
    [dismiss]
  );

  const handleReject = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dismiss("reject");
    },
    [dismiss]
  );

  if (!visible || !mounted) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className={cn(
        "pointer-events-auto fixed z-[10100] flex max-h-[min(70dvh,calc(100dvh-var(--site-header-height,113px)-2rem))] w-[calc(100vw-1.5rem)] flex-col rounded-md bg-brand-white p-3 shadow-[0_8px_32px_rgba(0,0,0,0.14)] touch-manipulation",
        "inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
        "sm:inset-x-auto sm:bottom-5 sm:right-6 sm:left-auto sm:max-h-none sm:w-80 sm:p-4"
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <h2 id="cookie-consent-title" className="text-sm font-semibold text-brand-black">
          {t("cookies.banner.title")}
        </h2>
        <p
          id="cookie-consent-description"
          className="mt-1.5 text-xs leading-relaxed text-gray-600 sm:mt-2 sm:text-sm"
        >
          {t("cookies.banner.description")}{" "}
          <Link href="/cookies" className="font-medium text-brand-black underline underline-offset-2">
            {t("cookies.banner.policyLink")}
          </Link>
          .{" "}
          <Link href="/privacy" className="font-medium text-brand-black underline underline-offset-2">
            {t("footer.privacyPolicy")}
          </Link>
        </p>
      </div>

      <div className="relative z-10 mt-3 flex shrink-0 flex-col gap-2 sm:mt-4 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="relative z-10 w-full touch-manipulation rounded-none border-gray-300 sm:flex-1"
          onClick={handleReject}
        >
          {t("cookies.banner.reject")}
        </Button>
        <Button
          type="button"
          size="sm"
          className="relative z-10 w-full touch-manipulation rounded-none sm:flex-1"
          onClick={handleAccept}
        >
          {t("cookies.banner.accept")}
        </Button>
      </div>
    </div>,
    document.body
  );
}
