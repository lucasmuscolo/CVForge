
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
  // Initialize with a default locale that is consistent on server and client initially.
  const [locale, setLocaleState] = useState<Locale>('en');

  // useEffect to set locale from localStorage/navigator only on the client-side after mount.
  useEffect(() => {
    let initialLocale: Locale = 'en'; // Default locale

    const storedLocale = localStorage.getItem('locale');
    if (storedLocale === 'en' || storedLocale === 'es') {
      initialLocale = storedLocale;
    } else {
      // Fallback to browser language if no locale is stored
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'es') {
        initialLocale = 'es';
      }
    }
    // Only update if the detected locale is different from the current state
    // to avoid unnecessary re-renders if it's already 'en'.
    if (initialLocale !== locale) {
      setLocaleState(initialLocale);
    }
  }, []); // Empty dependency array means this runs once on mount (client-side)


  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // localStorage interaction is fine here as it's a user-triggered action
    localStorage.setItem('locale', newLocale);
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

  