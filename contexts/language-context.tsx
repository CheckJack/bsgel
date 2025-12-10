"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "pt";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Import translations
import { en } from "@/lib/translations/en";
import { pt } from "@/lib/translations/pt";

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
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "pt")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    // Trigger a custom event to notify components of language change
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language: lang } }));
  };

  const t = (key: string, params?: Record<string, string>): string => {
    const translation = getNestedValue(translations[language], key);
    return replacePlaceholders(translation, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

