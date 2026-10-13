import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, t as translate, detectBrowserLanguage } from '@faithportal/core-utils';

interface LanguageContextType {
  lang: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  detectedCountry: string;
  isAutoDetected: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<SupportedLanguage>('ko');
  const [detectedCountry, setDetectedCountry] = useState<string>('KR');
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check user manual override in localStorage
    const savedLang = localStorage.getItem('user_lang') as SupportedLanguage | null;
    if (savedLang && (savedLang === 'ko' || savedLang === 'en')) {
      setLangState(savedLang);
      setIsAutoDetected(false);
      return;
    }

    // 2. Fetch region detection from API backend
    let isSubscribed = true;
    fetch('/api/v1/geo/country')
      .then(res => res.json())
      .then(data => {
        if (!isSubscribed) return;
        if (data && data.success) {
          const recLang: SupportedLanguage = data.recommendedLang === 'en' ? 'en' : 'ko';
          setDetectedCountry(data.country || 'KR');
          setLangState(recLang);
          setIsAutoDetected(true);
        } else {
          // Fallback to browser language
          setLangState(detectBrowserLanguage());
          setIsAutoDetected(true);
        }
      })
      .catch(() => {
        if (!isSubscribed) return;
        setLangState(detectBrowserLanguage());
        setIsAutoDetected(true);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const setLanguage = (newLang: SupportedLanguage) => {
    setLangState(newLang);
    setIsAutoDetected(false);
    localStorage.setItem('user_lang', newLang);
  };

  const t = (key: string) => translate(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t, detectedCountry, isAutoDetected }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
