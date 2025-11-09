import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// In a real app, you would use a more robust i18n library or dynamic imports
import en from '../../locales/en.json';
import ar from '../../locales/ar.json';

type Translations = { [key: string]: string };
type Language = 'en' | 'ar';

interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const translations: { [key in Language]: Translations } = { en, ar };

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('language') as Language | null;
        const initialLang = storedLanguage || (I18nManager.isRTL ? 'ar' : 'en');
        setLanguage(initialLang);
      } catch (error) {
        console.error("Failed to load language:", error);
        setLanguage('en');
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    try {
        await AsyncStorage.setItem('language', lang);
        I18nManager.forceRTL(lang === 'ar');
        // NOTE: In a real app, you might need to restart the app for RTL changes to take full effect.
        // For web, we can update the document direction.
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        }
        setLanguageState(lang);
    } catch (error) {
        console.error("Failed to set language:", error);
    }
  }, []);

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
    let translation = translations[language][key as keyof typeof translations[Language]] || key;
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
      });
    }
    return translation;
  }, [language]);

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
