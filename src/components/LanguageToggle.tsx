import { useLanguage } from '@/i18n/useLanguage';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  const next = language === 'ru' ? 'en' : 'ru';
  return (
    <button
      onClick={() => setLanguage(next)}
      aria-label={`Switch language to ${next.toUpperCase()}`}
      title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
      className="w-10 h-10 rounded-full bg-card border border-border hover:border-accent-primary/50 transition-all flex items-center justify-center text-xs font-bold tracking-widest text-foreground"
    >
      {language.toUpperCase()}
    </button>
  );
};
