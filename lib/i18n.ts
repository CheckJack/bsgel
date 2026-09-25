/**
 * Non-React translation helper for modules/class components that cannot use useLanguage().
 * Prefer useLanguage().t inside React components.
 */

import { en } from "@/lib/translations/en";
import { pt } from "@/lib/translations/pt";

export type AppLanguage = "en" | "pt";

const translations = { en, pt };

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let value: unknown = obj;
  for (const key of keys) {
    if (value && typeof value === "object" && key in (value as object)) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof value === "string" ? value : path;
}

function replacePlaceholders(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  let result = text;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

/** Resolve current UI language from localStorage (defaults to pt). */
export function getClientLanguage(): AppLanguage {
  if (typeof window === "undefined") return "pt";
  try {
    const saved = localStorage.getItem("language");
    if (saved === "en" || saved === "pt") return saved;
  } catch {
    /* ignore */
  }
  return "pt";
}

/** Translate a key using the current client language (or an explicit lang). */
export function translate(
  key: string,
  params?: Record<string, string>,
  lang?: AppLanguage
): string {
  try {
    const language = lang || getClientLanguage();
    const catalog = translations[language] || translations.en;
    return replacePlaceholders(getNestedValue(catalog, key), params);
  } catch {
    return key;
  }
}
