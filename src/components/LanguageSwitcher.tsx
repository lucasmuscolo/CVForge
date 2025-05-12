
// src/components/LanguageSwitcher.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { Languages } from 'lucide-react'; // Using an icon for language

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'es' : 'en';
    setLocale(nextLocale);
  };

  return (
    <Button onClick={toggleLanguage} variant="outline" size="sm">
      <Languages className="mr-2 h-4 w-4" />
      {locale === 'en' ? 'Español' : 'English'}
    </Button>
  );
}

  