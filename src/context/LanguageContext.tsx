// src/context/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES, TranslationType } from '../locales';

type LanguageContextType = {
  currentLanguage: string;
  t: TranslationType;
  changeLanguage: (lang: string) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en'); // Defaults to international EN

  useEffect(() => {
    AsyncStorage.getItem('@submate_lang').then(savedLang => {
      if (savedLang && LANGUAGES[savedLang]) setCurrentLanguage(savedLang);
    });
  }, []);

  const changeLanguage = async (lang: string) => {
    if (LANGUAGES[lang]) {
      setCurrentLanguage(lang);
      await AsyncStorage.setItem('@submate_lang', lang);
    }
  };

  const t = LANGUAGES[currentLanguage];

  return (
    <LanguageContext.Provider value={{ currentLanguage, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  
  // ROBUST PROTECTION FILTER: Prevents undefined component tree crashes
  if (!context) {
    console.error('🚨 useTranslation core fallback triggered: Make sure RootLayout renders <LanguageProvider>!');
    return {
      currentLanguage: 'en',
      t: LANGUAGES['en'], // Fallback safely to English instead of crashing the UI
      changeLanguage: async () => {},
    };
  }
  return context;
};
