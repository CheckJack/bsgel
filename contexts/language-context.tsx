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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load language preference from localStorage (only on client)
    if (typeof window !== "undefined" && allowsPreferences()) {
      try {
        const savedLanguage = localStorage.getItem("language") as Language | null;
        if (savedLanguage && (savedLanguage === "en" || savedLanguage === "pt")) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error("Failed to load language from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    const onConsentChange = () => {
      if (allowsPreferences()) {
        try {
          const savedLanguage = localStorage.getItem("language") as Language | null;
          if (savedLanguage && (savedLanguage === "en" || savedLanguage === "pt")) {
            setLanguageState(savedLanguage);
          }
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("cookieConsentChanged", onConsentChange);
    return () => window.removeEventListener("cookieConsentChanged", onConsentChange);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined" && allowsPreferences()) {
      try {
        localStorage.setItem("language", lang);
        window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language: lang } }));
      } catch (error) {
        console.error("Failed to save language to localStorage:", error);
      }
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

