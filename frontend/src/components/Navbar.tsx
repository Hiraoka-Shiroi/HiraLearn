import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { ModeToggle } from './ModeToggle';
import { TranslationKey } from '@/i18n/translations';

const navItems: { labelKey: TranslationKey; sectionId: string }[] = [
  { labelKey: 'nav_path', sectionId: 'the-path' },
  { labelKey: 'nav_pricing', sectionId: 'pricing' },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-border py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-accent-primary rounded-lg rotate-45 flex items-center justify-center">
            <div className="w-4 h-4 bg-background rounded-sm -rotate-45" />
          </div>
          <span className="text-xl font-bold tracking-tight">HiraLearn</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <button
              key={item.labelKey}
              onClick={() => scrollToSection(item.sectionId)}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              {t(item.labelKey)}
            </button>
          ))}
          <LanguageToggle />
          <ModeToggle />
          <ThemeToggle />
          <Link
            to="/login"
            className="bg-accent-primary hover:bg-accent-primary/90 text-white px-5 py-2 rounded-full text-sm font-medium transition-all"
          >
            {t('nav_start')}
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 w-full bg-card border-b border-border p-6 flex flex-col space-y-4 md:hidden"
        >
          {navItems.map((item) => (
            <button
              key={item.labelKey}
              onClick={() => scrollToSection(item.sectionId)}
              className="text-lg text-muted hover:text-foreground text-left"
            >
              {t(item.labelKey)}
            </button>
          ))}
          <div className="flex gap-3">
            <LanguageToggle />
            <ModeToggle />
            <ThemeToggle />
          </div>
          <Link
            to="/login"
            className="bg-accent-primary hover:bg-accent-primary/90 text-white px-5 py-2 rounded-full text-sm font-medium transition-all text-center"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('nav_start')}
          </Link>
        </motion.div>
      )}
    </nav>
  );
};
