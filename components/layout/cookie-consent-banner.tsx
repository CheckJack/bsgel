"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import {
  acceptAllCookies,
  clearMarketingCookies,
  hasStoredConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  readConsentFromDocument,
  rejectOptionalCookies,
  writeConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";
import {
  HOME_ENTRY_LOADER_COMPLETE_EVENT,
  releaseHomeScrollLock,
} from "@/lib/home-entry-loader";
import { cn } from "@/lib/utils";

type PrefState = {
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

function consentToPrefState(consent: CookieConsentChoice | null): PrefState {
  return {
    preferences: consent?.preferences ?? false,
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  };
}

export function CookieConsentBanner() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mounted, setMounted] = useState(false);
  const [hasConsentChoice, setHasConsentChoice] = useState(() => hasStoredConsent());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState<PrefState>(() =>
    consentToPrefState(readConsentFromDocument())
  );
  const [entryLoaderComplete, setEntryLoaderComplete] = useState(!isHome);

  useEffect(() => {
    setMounted(true);
    setHasConsentChoice(hasStoredConsent());
    setPrefs(consentToPrefState(readConsentFromDocument()));
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

  useEffect(() => {
    const onOpenSettings = () => {
      setPrefs(consentToPrefState(readConsentFromDocument()));
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
  }, []);

  const hiddenRoute =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/salons";

  const firstVisitVisible =
    mounted && !hiddenRoute && !hasConsentChoice && !settingsOpen && entryLoaderComplete;
  const settingsVisible = mounted && !hiddenRoute && settingsOpen;
  const visible = firstVisitVisible || settingsVisible;

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

  const closeAfterSave = useCallback((choice: CookieConsentChoice) => {
    setPrefs(consentToPrefState(choice));
    setHasConsentChoice(true);
    setSettingsOpen(false);
  }, []);

  const handleAccept = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      closeAfterSave(acceptAllCookies());
    },
    [closeAfterSave]
  );

  const handleReject = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      closeAfterSave(rejectOptionalCookies());
    },
    [closeAfterSave]
  );

  const handleSavePreferences = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!prefs.marketing) {
        clearMarketingCookies();
      }
      closeAfterSave(
        writeConsent({
          preferences: prefs.preferences,
          analytics: prefs.analytics,
          marketing: prefs.marketing,
        })
      );
    },
    [closeAfterSave, prefs]
  );

  const handleManage = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setPrefs(consentToPrefState(readConsentFromDocument()));
    setSettingsOpen(true);
  }, []);

  if (!visible || !mounted) {
    return null;
  }

  const toggleRows: { key: keyof PrefState; labelKey: string; descKey: string }[] = [
    {
      key: "preferences",
      labelKey: "cookies.settings.preferences",
      descKey: "cookies.settings.preferencesDesc",
    },
    {
      key: "analytics",
      labelKey: "cookies.settings.analytics",
      descKey: "cookies.settings.analyticsDesc",
    },
    {
      key: "marketing",
      labelKey: "cookies.settings.marketing",
      descKey: "cookies.settings.marketingDesc",
    },
  ];

  return createPortal(
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className={cn(
        "pointer-events-auto fixed z-[10100] flex max-h-[min(80dvh,calc(100dvh-var(--site-header-height,113px)-2rem))] w-[calc(100vw-1.5rem)] flex-col rounded-md bg-brand-white p-3 shadow-[0_8px_32px_rgba(0,0,0,0.14)] touch-manipulation",
        "inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
        "sm:inset-x-auto sm:bottom-5 sm:right-6 sm:left-auto sm:w-96 sm:p-4",
        settingsVisible && "sm:max-h-[min(85dvh,40rem)]"
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <h2 id="cookie-consent-title" className="text-sm font-semibold text-brand-black">
          {settingsVisible ? t("cookies.settings.title") : t("cookies.banner.title")}
        </h2>
        <p
          id="cookie-consent-description"
          className="mt-1.5 text-xs leading-relaxed text-gray-600 sm:mt-2 sm:text-sm"
        >
          {settingsVisible ? t("cookies.settings.description") : t("cookies.banner.description")}{" "}
          <Link href="/cookies" className="font-medium text-brand-black underline underline-offset-2">
            {t("cookies.banner.policyLink")}
          </Link>
          .{" "}
          <Link href="/privacy" className="font-medium text-brand-black underline underline-offset-2">
            {t("footer.privacyPolicy")}
          </Link>
        </p>

        {settingsVisible ? (
          <div className="mt-3 space-y-3">
            <div className="rounded border border-black/10 px-3 py-2">
              <p className="text-xs font-semibold text-brand-black">
                {t("cookies.settings.essential")}
              </p>
              <p className="mt-0.5 text-xs text-gray-600">{t("cookies.settings.essentialDesc")}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                {t("cookies.settings.alwaysOn")}
              </p>
            </div>
            {toggleRows.map((row) => (
              <label
                key={row.key}
                className="flex cursor-pointer items-start justify-between gap-3 rounded border border-black/10 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-brand-black">
                    {t(row.labelKey)}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-600">{t(row.descKey)}</span>
                </span>
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-black"
                  checked={prefs[row.key]}
                  onChange={(event) =>
                    setPrefs((current) => ({
                      ...current,
                      [row.key]: event.target.checked,
                    }))
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative z-10 mt-3 flex shrink-0 flex-col gap-2 sm:mt-4">
        {settingsVisible ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
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
                onClick={handleSavePreferences}
              >
                {t("cookies.settings.save")}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="relative z-10 w-full touch-manipulation rounded-none text-xs"
              onClick={handleAccept}
            >
              {t("cookies.banner.accept")}
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="relative z-10 w-full touch-manipulation rounded-none text-xs"
              onClick={handleManage}
            >
              {t("cookies.settings.manage")}
            </Button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
