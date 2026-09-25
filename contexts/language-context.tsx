"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "pt";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  tArray: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Import translations
import { en } from "@/lib/translations/en";
import { pt } from "@/lib/translations/pt";
import { allowsPreferences } from "@/lib/cookie-consent";

const translations = { en, pt };

// Helper function to get nested translation value
function getNestedValue(obj: any, path: string): string {
  const keys = path.split(".");
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return path; // Return the key path if not found
    }
  }
  
  return typeof value === "string" ? value : path;
}

// Helper function to get nested translation value as array
function getNestedArray(obj: any, path: string): string[] {
  const keys = path.split(".");
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return []; // Return empty array if not found
    }
  }
  
  return Array.isArray(value) ? value : [];
}

// Helper function to replace placeholders
function replacePlaceholders(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  
  let result = text;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

function applyDocumentLang(lang: Language) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
}

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  try {
    // Session keeps the in-tab language choice even without preference cookies.
    const fromSession = sessionStorage.getItem("language") as Language | null;
    if (fromSession === "en" || fromSession === "pt") return fromSession;
    if (allowsPreferences()) {
      const fromLocal = localStorage.getItem("language") as Language | null;
      if (fromLocal === "en" || fromLocal === "pt") return fromLocal;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persistLanguage(lang: Language) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("language", lang);
  } catch {
    /* ignore */
  }
  if (allowsPreferences()) {
    try {
      localStorage.setItem("language", lang);
    } catch (error) {
      console.error("Failed to save language to localStorage:", error);
    }
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLanguage = readStoredLanguage();
    if (savedLanguage) {
      setLanguageState(savedLanguage);
      applyDocumentLang(savedLanguage);
      return;
    }
    applyDocumentLang("pt");
  }, []);

  useEffect(() => {
    if (mounted) {
      applyDocumentLang(language);
    }
  }, [language, mounted]);

  useEffect(() => {
    const onConsentChange = () => {
      const savedLanguage = readStoredLanguage();
      if (savedLanguage) {
        setLanguageState(savedLanguage);
      }
    };
    window.addEventListener("cookieConsentChanged", onConsentChange);
    return () => window.removeEventListener("cookieConsentChanged", onConsentChange);
  }, []);

  useEffect(() => {
    const onLanguageChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ language?: Language }>).detail;
      const next = detail?.language;
      if (next === "en" || next === "pt") {
        setLanguageState(next);
      }
    };
    window.addEventListener("languageChanged", onLanguageChanged);
    return () => window.removeEventListener("languageChanged", onLanguageChanged);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    applyDocumentLang(lang);
    if (typeof window !== "undefined") {
      // Always notify listeners so UI stays in sync even when prefs cookies are blocked
      window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language: lang } }));
      persistLanguage(lang);
    }
  };

  const t = (key: string, params?: Record<string, string>): string => {
    try {
      const currentTranslations = translations[language] || translations.en;
      const translation = getNestedValue(currentTranslations, key);
      return replacePlaceholders(translation, params);
    } catch (error) {
      console.error("Translation error:", error, "key:", key);
      return key; // Return the key as fallback
    }
  };

  const tArray = (key: string): string[] => {
    try {
      const currentTranslations = translations[language] || translations.en;
      return getNestedArray(currentTranslations, key);
    } catch (error) {
      console.error("Translation array error:", error, "key:", key);
      return []; // Return empty array as fallback
    }
  };

  // Ensure context value is always defined
  const contextValue = {
    language,
    setLanguage,
    t,
    tArray,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
