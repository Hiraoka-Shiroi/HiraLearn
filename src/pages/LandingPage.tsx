import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Methodology } from '@/components/Methodology';
import { Pricing } from '@/components/Pricing';
import { useLanguage } from '@/i18n/useLanguage';

export const LandingPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Methodology />
        <Pricing />
      </main>
      <footer className="py-12 border-t border-border bg-card">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-accent-primary rounded flex items-center justify-center rotate-45">
                <div className="w-3 h-3 bg-background rounded-sm -rotate-45" />
              </div>
              <span className="text-lg font-bold">HiraLearn</span>
            </div>
            <p className="text-muted text-sm max-w-xs">
              {t('footer_description')}
            </p>
          </div>
          <div className="text-muted text-sm">
            {t('footer_copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
};
