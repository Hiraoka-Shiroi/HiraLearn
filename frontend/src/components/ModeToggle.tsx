import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { useLanguage } from '@/i18n/useLanguage';

export const ModeToggle = () => {
  const { mode, toggleMode } = useThemeStore();
  const { t } = useLanguage();
  const isDark = mode === 'dark';
  return (
    <button
      onClick={toggleMode}
      aria-label={isDark ? t('theme_light') : t('theme_dark')}
      title={isDark ? t('theme_light') : t('theme_dark')}
      className="w-10 h-10 rounded-full bg-card border border-border hover:border-accent-primary/50 transition-all flex items-center justify-center text-foreground"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};
