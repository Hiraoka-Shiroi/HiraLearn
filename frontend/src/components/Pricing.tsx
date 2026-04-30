import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';
import { TranslationKey } from '@/i18n/translations';

const tierKeys: {
  nameKey: TranslationKey;
  priceKey: TranslationKey;
  descKey: TranslationKey;
  features: TranslationKey[];
  ctaKey: TranslationKey;
  featured: boolean;
  isLifetime: boolean;
}[] = [
  {
    nameKey: 'pricing_free',
    priceKey: 'pricing_free_price',
    descKey: 'pricing_free_desc',
    features: ['pricing_free_f1', 'pricing_free_f2', 'pricing_free_f3', 'pricing_free_f4'],
    ctaKey: 'pricing_free_cta',
    featured: false,
    isLifetime: false,
  },
  {
    nameKey: 'pricing_student',
    priceKey: 'pricing_student_price',
    descKey: 'pricing_student_desc',
    features: ['pricing_student_f1', 'pricing_student_f2', 'pricing_student_f3', 'pricing_student_f4'],
    ctaKey: 'pricing_student_cta',
    featured: false,
    isLifetime: false,
  },
  {
    nameKey: 'pricing_pro',
    priceKey: 'pricing_pro_price',
    descKey: 'pricing_pro_desc',
    features: ['pricing_pro_f1', 'pricing_pro_f2', 'pricing_pro_f3', 'pricing_pro_f4', 'pricing_pro_f5'],
    ctaKey: 'pricing_pro_cta',
    featured: true,
    isLifetime: false,
  },
  {
    nameKey: 'pricing_lifetime',
    priceKey: 'pricing_lifetime_price',
    descKey: 'pricing_lifetime_desc',
    features: ['pricing_lifetime_f1', 'pricing_lifetime_f2', 'pricing_lifetime_f3', 'pricing_lifetime_f4'],
    ctaKey: 'pricing_lifetime_cta',
    featured: false,
    isLifetime: true,
  },
];

export const Pricing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('pricing_title')}</h2>
          <p className="text-muted max-w-xl mx-auto">
            {t('pricing_subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tierKeys.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-[2rem] border transition-all ${
                tier.featured
                  ? 'bg-accent-primary border-accent-primary shadow-2xl shadow-accent-primary/20 scale-105 z-10'
                  : 'bg-card border-border hover:border-muted'
              }`}
            >
              <div className="mb-8">
                <h3 className={`text-lg font-bold mb-2 ${tier.featured ? 'text-white' : 'text-foreground'}`}>
                  {t(tier.nameKey)}
                </h3>
                <div className="flex items-baseline">
                  <span className={`text-4xl font-bold ${tier.featured ? 'text-white' : 'text-foreground'}`}>
                    {t(tier.priceKey)} {t('pricing_currency')}
                  </span>
                  <span className={`text-sm ml-1 ${tier.featured ? 'text-white/70' : 'text-muted'}`}>
                    {!tier.isLifetime && t('pricing_per_month')}
                  </span>
                </div>
                <p className={`text-sm mt-4 ${tier.featured ? 'text-white/80' : 'text-muted'}`}>
                  {t(tier.descKey)}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((fKey, fIndex) => (
                  <li key={fIndex} className="flex items-start text-sm">
                    <Check
                      className={`mr-3 mt-0.5 shrink-0 ${tier.featured ? 'text-white' : 'text-accent-primary'}`}
                      size={16}
                    />
                    <span className={tier.featured ? 'text-white/90' : 'text-muted'}>{t(fKey)}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/pricing')}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  tier.featured
                    ? 'bg-white text-accent-primary hover:bg-slate-100'
                    : 'bg-background border border-border hover:bg-border'
                }`}
              >
                {t(tier.ctaKey)}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
