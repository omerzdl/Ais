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

const STORAGE_KEY = 'ais_language';

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      // Ana sayfadaki dil tercihini kontrol et
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && ['en', 'tr', 'ru', 'sr', 'hr', 'ro'].includes(saved)) {
        return saved;
      }
      // Tarayıcı dilini kontrol et
      const browserLang = navigator.language.split('-')[0].toLowerCase();
      if (['en', 'tr', 'ru', 'sr', 'hr', 'ro'].includes(browserLang)) {
        return browserLang as Language;
      }
    }
    // Varsayılan dil: İngilizce
    return 'en';
  });

  // Ana sayfadaki dil değişikliklerini dinle
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Storage event listener (diğer tab'lardaki değişiklikler için)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newLang = e.newValue as Language;
        if (['en', 'tr', 'ru', 'sr', 'hr', 'ro'].includes(newLang)) {
          setLanguageState(newLang);
        }
      }
    };

    // Custom event listener (aynı sayfadaki değişiklikler için)
    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newLang = customEvent.detail as Language;
      if (newLang && ['en', 'tr', 'ru', 'sr', 'hr', 'ro'].includes(newLang)) {
        setLanguageState(newLang);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languagechange', handleLanguageChange);

    // Sayfa yüklendiğinde tekrar kontrol et
    const checkLanguage = () => {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && ['en', 'tr', 'ru', 'sr', 'hr', 'ro'].includes(saved) && saved !== language) {
        setLanguageState(saved);
      }
    };
    
    // İlk yüklemede ve periyodik olarak kontrol et
    checkLanguage();
    const interval = setInterval(checkLanguage, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languagechange', handleLanguageChange as EventListener);
      clearInterval(interval);
    };
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    // Ana sayfadaki i18n sistemini de güncelle
    if (typeof window !== 'undefined' && (window as any).i18n) {
      (window as any).i18n.setLanguage(lang);
    }
    // Custom event gönder
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('languagechange', { detail: lang }));
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


