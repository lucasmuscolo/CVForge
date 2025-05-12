
// src/context/LanguageContext.tsx
'use client';

import React, { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import type { FC } from 'react';
import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';

type Locale = 'en' | 'es';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: Record<string, any>; // Consider using a more specific type if possible
}

const translationsData: Record<Locale, Record<string, any>> = {
  en: enTranslations,
  es: esTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Try to get the locale from localStorage or default to 'en'
    if (typeof window !== 'undefined') {
      const storedLocale = localStorage.getItem('locale');
      if (storedLocale === 'en' || storedLocale === 'es') {
        return storedLocale;
      }
      // Fallback to browser language if no locale is stored
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'es') {
          return 'es';
      }
    }
    return 'en'; // Default locale
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  }, []);


  // Load translations based on the current locale
  const translations = translationsData[locale];

  const value = {
    locale,
    setLocale,
    translations,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export default LanguageContext;

  