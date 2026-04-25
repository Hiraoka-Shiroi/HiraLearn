import { useLanguage } from '@/i18n/useLanguage';
import { Globe } from 'lucide-react';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-accent-primary/50 transition-all text-sm font-bold"
      title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
    >
      <Globe size={16} className="text-accent-primary" />
      <span className="uppercase text-xs tracking-widest">{language === 'ru' ? 'EN' : 'RU'}</span>
    </button>
  );
};
