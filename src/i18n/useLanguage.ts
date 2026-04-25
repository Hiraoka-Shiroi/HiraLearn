import { create } from 'zustand';
import { translations, Language, TranslationKey } from './translations';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const getSavedLanguage = (): Language => {
  try {
    const saved = localStorage.getItem('hiralearn-language');
    if (saved === 'en' || saved === 'ru') return saved;
  } catch {
    // localStorage not available
  }
  return 'ru';
};

export const useLanguage = create<LanguageState>((set, get) => ({
  language: getSavedLanguage(),
  setLanguage: (lang) => {
    try {
      localStorage.setItem('hiralearn-language', lang);
    } catch {
      // localStorage not available
    }
    set({ language: lang });
  },
  t: (key) => {
    const { language } = get();
    return translations[language][key] || key;
  },
}));
