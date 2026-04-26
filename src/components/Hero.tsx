import { motion } from 'framer-motion';
import { ArrowRight, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const scrollToCurriculum = () => {
    const el = document.getElementById('the-path');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-success/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-medium tracking-widest uppercase border border-accent-primary/30 rounded-full text-accent-primary bg-accent-primary/5">
            {t('hero_badge')}
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.1]">
            {t('hero_title_1')} <br />
            <span className="text-muted">{t('hero_title_2')}</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted mb-10 leading-relaxed">
            {t('hero_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-accent-primary text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center group transition-all hover:scale-105 shadow-xl shadow-accent-primary/20"
            >
              {t('hero_cta')}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </button>
            <button
              onClick={scrollToCurriculum}
              className="w-full sm:w-auto bg-card border border-border px-8 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-border transition-colors"
            >
              <Terminal className="mr-2 text-accent-primary" size={20} />
              {t('hero_curriculum')}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-20 relative max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-2 shadow-2xl">
            <div className="flex items-center space-x-2 px-4 py-3 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-red-500/20" />
              <div className="w-3 h-3 rounded-full bg-amber-500/20" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
              <span className="text-xs text-muted font-mono ml-4">index.html</span>
            </div>
            <div className="p-6 text-left font-mono text-sm leading-relaxed overflow-x-auto">
              <div className="flex"><span className="text-muted mr-4">1</span><span className="text-accent-primary">&lt;article</span> <span className="text-accent-success">class</span>=<span className="text-amber-500">"mastery-path"</span>&gt;</div>
              <div className="flex"><span className="text-muted mr-4">2</span>  &nbsp;&lt;h1&gt;The Path Begins Here&lt;/h1&gt;</div>
              <div className="flex"><span className="text-muted mr-4">3</span>  &nbsp;&lt;p&gt;Master the fundamentals first.&lt;/p&gt;</div>
              <div className="flex"><span className="text-muted mr-4">4</span><span className="text-accent-primary">&lt;/article&gt;</span></div>
            </div>
          </div>

          <div className="absolute -top-6 -right-6 bg-accent-success text-background text-xs font-bold px-4 py-2 rounded-lg shadow-xl -rotate-12 hidden md:block">
            AI-POWERED
          </div>
        </motion.div>
      </div>
    </section>
  );
};
