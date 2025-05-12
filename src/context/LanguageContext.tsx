
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
  translations: Record<string, any>; 
}

const translationsData: Record<Locale, Record<string, any>> = {
  en: enTranslations,
  es: esTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('en'); // Initialize with a default

  useEffect(() => {
    // This effect runs only on the client, after hydration
    let initialLocale: Locale = 'en'; 
    const storedLocale = localStorage.getItem('locale');

    if (storedLocale === 'en' || storedLocale === 'es') {
      initialLocale = storedLocale;
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'es') {
        initialLocale = 'es';
      }
    }
    
    // Only call setLocaleState if the determined locale is different
    // from the one already in state to prevent an unnecessary update.
    if (initialLocale !== locale) {
        setLocaleState(initialLocale);
    }
  }, []); // Empty dependency array ensures this runs once on mount (client-side)


  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  }, []);


  const translations = translationsData[locale];

  const value = {
    locale,
    setLocale,
    translations,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export default LanguageContext;

  
