'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/types/translations';
import { translations as enTranslations } from '@/translations/en';
import { translations as mnTranslations } from '@/translations/mn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof enTranslations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'ezbox-language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Mongolian
  const [language, setLanguageState] = useState<Language>('mn');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'mn') {
      setLanguageState(stored);
    }
  }, []);

  // Save language preference to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  // Translation function with fallback to English
  const t = (key: keyof typeof enTranslations): string => {
    if (language === 'mn') {
      // Try Mongolian first, fallback to English if not found
      return mnTranslations[key] || enTranslations[key] || key;
    }
    // English
    return enTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
