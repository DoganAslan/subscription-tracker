import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import en from './translations/en.json';
import tr from './translations/tr.json';
import es from './translations/es.json';
import zh from './translations/zh.json';
import hi from './translations/hi.json';
import ar from './translations/ar.json';
import fr from './translations/fr.json';
import ru from './translations/ru.json';
import pt from './translations/pt.json';
import de from './translations/de.json';
import ja from './translations/ja.json';
import id from './translations/id.json';
import bn from './translations/bn.json';
import ur from './translations/ur.json';
import ko from './translations/ko.json';
import it from './translations/it.json';
import vi from './translations/vi.json';
import te from './translations/te.json';
import mr from './translations/mr.json';
import ta from './translations/ta.json';

export const resources = {
  en: { translation: en },
  tr: { translation: tr },
  es: { translation: es },
  zh: { translation: zh },
  hi: { translation: hi },
  ar: { translation: ar },
  fr: { translation: fr },
  ru: { translation: ru },
  pt: { translation: pt },
  de: { translation: de },
  ja: { translation: ja },
  id: { translation: id },
  bn: { translation: bn },
  ur: { translation: ur },
  ko: { translation: ko },
  it: { translation: it },
  vi: { translation: vi },
  te: { translation: te },
  mr: { translation: mr },
  ta: { translation: ta },
};

export const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'ru', label: 'Русский' },
  { code: 'pt', label: 'Português' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ur', label: 'اردو' },
  { code: 'ko', label: '한국어' },
  { code: 'it', label: 'Italiano' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
];

const initI18n = async () => {
  let savedLanguage: string | null = null;

  if (Platform.OS === 'web' && typeof window === 'undefined') {
    // Prevent SSR crashes
    savedLanguage = 'en';
  } else {
    try {
      savedLanguage = await AsyncStorage.getItem('user-language');
    } catch (e) {
      console.warn('Failed to read language from storage', e);
    }

    if (!savedLanguage) {
      try {
        const locales = Localization.getLocales();
        if (locales && locales.length > 0) {
          savedLanguage = locales[0].languageCode;
        }
      } catch (e) {
        console.warn('Failed to get device locales', e);
      }
    }
  }

  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: savedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react is already safe from xss
    },
  });
};

initI18n();

export default i18n;
