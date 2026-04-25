import { motion } from 'framer-motion';
import { Target, Zap, Shield, BookOpen } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';
import { TranslationKey } from '@/i18n/translations';

const featureKeys: { icon: React.ReactNode; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: <Target className="text-accent-primary" />, titleKey: 'methodology_ladder_title', descKey: 'methodology_ladder_desc' },
  { icon: <Zap className="text-accent-success" />, titleKey: 'methodology_ai_title', descKey: 'methodology_ai_desc' },
  { icon: <Shield className="text-accent-warning" />, titleKey: 'methodology_retention_title', descKey: 'methodology_retention_desc' },
  { icon: <BookOpen className="text-accent-danger" />, titleKey: 'methodology_projects_title', descKey: 'methodology_projects_desc' },
];

export const Methodology = () => {
  const { t } = useLanguage();

  return (
    <section id="the-path" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('methodology_title')}</h2>
          <p className="text-muted max-w-xl mx-auto">
            {t('methodology_subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureKeys.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-card border border-border hover:border-accent-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mb-6 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{t(feature.titleKey)}</h3>
              <p className="text-muted text-sm leading-relaxed">
                {t(feature.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
