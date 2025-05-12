
// src/hooks/useTranslation.ts
import { useContext } from 'react';
import LanguageContext from '@/context/LanguageContext';
import { get } from 'lodash-es'; // Using lodash-es for tree-shakable get

// Helper function to replace placeholders like {name}
const replacePlaceholders = (text: string, placeholders?: Record<string, string | number>): string => {
    if (!placeholders) {
        return text;
    }
    let result = text;
    Object.keys(placeholders).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, String(placeholders[key]));
    });
    return result;
};


export function useTranslation() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { locale, setLocale, translations } = context;

  // The translation function 't'
  const t = (key: string, placeholders?: Record<string, string | number>): string => {
    // Use lodash get to safely access nested keys
    const translation = get(translations, key);

    if (typeof translation === 'string') {
        return replacePlaceholders(translation, placeholders);
    }

    // Fallback if translation is not found or not a string
    console.warn(`Translation key "${key}" not found for locale "${locale}".`);
    return key; // Return the key itself as fallback
  };

  return {
    t,
    locale,
    setLocale,
  };
}

  