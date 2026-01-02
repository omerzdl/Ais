import React, { createContext, useContext, useState, ReactNode } from 'react';
import enTranslations from '../translations/en.json';
import trTranslations from '../translations/tr.json';
import ruTranslations from '../translations/ru.json';
import srTranslations from '../translations/sr.json';
import hrTranslations from '../translations/hr.json';
import roTranslations from '../translations/ro.json';

export type Language = 'en' | 'tr' | 'ru' | 'sr' | 'hr' | 'ro';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

const translations: Record<Language, any> = {
  en: enTranslations,
  tr: trTranslations,
  ru: ruTranslations,
  sr: srTranslations,
  hr: hrTranslations,
  ro: roTranslations
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Language | null;
      if (saved && ['en', 'tr', 'ru', 'sr', 'hr', 'ro'].includes(saved)) {
        return saved;
      }
    }
    // Varsayılan dil: İngilizce
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // Statik HTML sayfası için de güncelle
    if (typeof window !== 'undefined' && (window as any).updateStaticTranslations) {
      (window as any).updateStaticTranslations(lang);
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

