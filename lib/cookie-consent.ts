export const CONSENT_COOKIE_NAME = "bsg_cookie_consent";
export const CONSENT_VERSION = 1;
const CONSENT_MAX_AGE_DAYS = 365;

export type CookieConsentChoice = {
  version: number;
  essential: true;
  preferences: boolean;
  marketing: boolean;
  analytics: boolean;
  timestamp: string;
};

export const DEFAULT_CONSENT: CookieConsentChoice = {
  version: CONSENT_VERSION,
  essential: true,
  preferences: false,
  marketing: false,
  analytics: false,
  timestamp: "",
};

export function parseConsent(raw: string | null): CookieConsentChoice | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsentChoice;
    if (parsed.version !== CONSENT_VERSION || parsed.essential !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readConsentFromDocument(): CookieConsentChoice | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const value = decodeURIComponent(match.split("=").slice(1).join("="));
    return parseConsent(value);
  } catch {
    return null;
  }
}

export function writeConsent(choice: Omit<CookieConsentChoice, "version" | "essential" | "timestamp">) {
  const payload: CookieConsentChoice = {
    version: CONSENT_VERSION,
    essential: true,
    preferences: choice.preferences,
    marketing: choice.marketing,
    analytics: choice.analytics,
    timestamp: new Date().toISOString(),
  };

  const encoded = encodeURIComponent(JSON.stringify(payload));
  const expires = new Date();
  expires.setDate(expires.getDate() + CONSENT_MAX_AGE_DAYS);

  document.cookie = `${CONSENT_COOKIE_NAME}=${encoded}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

  try {
    localStorage.setItem(CONSENT_COOKIE_NAME, JSON.stringify(payload));
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: payload }));
  return payload;
}

export function acceptAllCookies() {
  return writeConsent({ preferences: true, marketing: true, analytics: true });
}

export function rejectOptionalCookies() {
  clearMarketingCookies();
  return writeConsent({ preferences: false, marketing: false, analytics: false });
}

export function hasStoredConsent(): boolean {
  return readConsentFromDocument() !== null;
}

export function allowsPreferences(): boolean {
  return readConsentFromDocument()?.preferences ?? false;
}

export function allowsMarketing(): boolean {
  return readConsentFromDocument()?.marketing ?? false;
}

export function clearMarketingCookies() {
  document.cookie = "referralCode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
  try {
    localStorage.removeItem("referralCode");
  } catch {
    /* ignore */
  }
}
