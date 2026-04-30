import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Zap, Award, Users, Rocket, CreditCard, Phone, X, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';
import { TranslationKey } from '@/i18n/translations';
import { trackEvent } from '@/lib/firebase/analytics';
import { isPaddleConfigured, openPaddleCheckout } from '@/lib/paddle/client';
import { supabase } from '@/lib/supabase/client';

const KASPI_PHONE = '+7 708 261 77 89';

interface PlanInfo {
  id: 'student' | 'pro' | 'lifetime';
  nameKey: TranslationKey;
  priceKey: TranslationKey;
  icon: React.ReactNode;
  featureKeys: TranslationKey[];
  highlight: boolean;
  ctaKey: TranslationKey;
}

const plans: PlanInfo[] = [
  {
    id: 'student',
    nameKey: 'pricing_student',
    priceKey: 'pricing_student_price',
    icon: <Users className="text-accent-primary" />,
    featureKeys: ['pricing_student_f1', 'pricing_student_f2', 'pricing_student_f3', 'pricing_student_f4'],
    highlight: false,
    ctaKey: 'pricing_student_cta'
  },
  {
    id: 'pro',
    nameKey: 'pricing_pro',
    priceKey: 'pricing_pro_price',
    icon: <Rocket className="text-accent-success" />,
    featureKeys: ['pricing_pro_f1', 'pricing_pro_f2', 'pricing_pro_f3', 'pricing_pro_f4', 'pricing_pro_f5'],
    highlight: true,
    ctaKey: 'pricing_pro_cta'
  },
  {
    id: 'lifetime',
    nameKey: 'pricing_lifetime',
    priceKey: 'pricing_lifetime_price',
    icon: <Award className="text-accent-warning" />,
    featureKeys: ['pricing_lifetime_f1', 'pricing_lifetime_f2', 'pricing_lifetime_f3', 'pricing_lifetime_f4'],
    highlight: false,
    ctaKey: 'pricing_lifetime_cta'
  }
];

export const PricingPage = () => {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handlePurchase = async (plan: PlanInfo) => {
    if (!user) {
      navigate('/login');
      return;
    }
    void trackEvent('payment_click', { plan: plan.id });
    if (isPaddleConfigured) {
      const ok = await openPaddleCheckout({
        plan: plan.id,
        email: user.email,
        userId: user.id,
      });
      if (ok) return;
    }
    setSelectedPlan(plan);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-24">
        {paymentSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-8 p-4 bg-accent-success/10 border border-accent-success/30 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="text-accent-success shrink-0" size={20} />
            <p className="text-sm">{t('pricing_payment_success')}</p>
          </motion.div>
        )}
        <div className="text-center mb-10 md:mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 tracking-tight"
          >
            {t('pricing_page_title')} <span className="text-accent-primary">{t('pricing_page_title_accent')}</span>.
          </motion.h1>
          <p className="text-muted max-w-2xl mx-auto text-lg">
            {t('pricing_page_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.nameKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border transition-all ${
                plan.highlight
                  ? 'bg-card border-accent-success shadow-2xl shadow-accent-success/10 md:scale-105 z-10'
                  : 'bg-card border-border active:border-muted md:hover:border-muted'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-success text-background text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {t('pricing_recommended')}
                </div>
              )}

              <div className="mb-5 md:mb-8">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-background border border-border flex items-center justify-center mb-4 md:mb-6">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{t(plan.nameKey)}</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-bold">{t(plan.priceKey)} ₸</span>
                  <span className="text-muted text-sm">{plan.id !== 'lifetime' && t('pricing_per_month')}</span>
                </div>
              </div>

              <ul className="space-y-3 md:space-y-4 mb-6 md:mb-10">
                {plan.featureKeys.map((featureKey) => (
                  <li key={featureKey} className="flex items-start text-sm">
                    <Check className="text-accent-success mr-3 mt-0.5 shrink-0" size={16} />
                    <span className="text-muted">{t(featureKey)}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => { void handlePurchase(plan); }}
                className={`w-full py-4 rounded-xl md:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 min-h-[48px] ${
                plan.highlight
                  ? 'bg-accent-success text-background active:scale-[0.98] md:hover:scale-[1.02]'
                  : 'bg-background border border-border active:bg-border md:hover:bg-border'
              }`}>
                <CreditCard size={18} />
                {t(plan.ctaKey)}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Security / Trust */}
        <div className="mt-12 md:mt-24 pt-8 md:pt-12 border-t border-border flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">{t('pricing_page_security')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">{t('pricing_page_instant')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase">
             🇰🇿 {t('pricing_page_kzt')}
          </div>
        </div>
      </main>

      {/* Kaspi Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-t-2xl md:rounded-[2.5rem] p-5 md:p-12 max-w-lg w-full shadow-2xl relative safe-bottom"
          >
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-6 right-6 p-2 rounded-xl hover:bg-border transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Phone className="text-accent-primary" size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('pricing_page_kaspi')}</h2>
              <p className="text-muted text-sm">
                {t('pricing_payment_instructions')}:
              </p>
            </div>

            <div className="bg-background border border-border rounded-2xl p-6 mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">{t('pricing_modal_plan')}:</span>
                <span className="font-bold">{t(selectedPlan.nameKey)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">{t('pricing_modal_amount')}:</span>
                <span className="font-bold text-2xl text-accent-primary">{t(selectedPlan.priceKey)} ₸</span>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-muted text-xs mb-2 uppercase font-bold tracking-widest">{t('pricing_modal_phone')}:</p>
                <p className="text-2xl font-black text-accent-success tracking-wider text-center py-2">
                  {KASPI_PHONE}
                </p>
              </div>
            </div>

            <div className="bg-accent-warning/5 border border-accent-warning/20 rounded-2xl p-4 mb-6">
              <p className="text-xs text-accent-warning leading-relaxed">
                <b>{t('pricing_modal_important')}</b>{' '}
                {t('pricing_modal_instruction').replace(
                  '{email}',
                  user?.email || t('pricing_modal_your_email'),
                )}
              </p>
            </div>

            <button
              onClick={async () => {
                if (!user || !selectedPlan) return;
                setSubmitting(true);
                try {
                  await supabase.from('subscriptions').upsert({
                    user_id: user.id,
                    plan: selectedPlan.id,
                    status: 'pending',
                    provider: 'kaspi',
                  }, { onConflict: 'user_id' });
                  void trackEvent('kaspi_payment_submitted', { plan: selectedPlan.id });
                } catch {
                  // continue even if DB write fails
                }
                setSubmitting(false);
                setSelectedPlan(null);
                setPaymentSubmitted(true);
              }}
              disabled={submitting}
              className="w-full bg-accent-success text-background py-4 rounded-xl md:rounded-2xl font-bold active:scale-[0.98] md:hover:scale-[1.02] transition-all disabled:opacity-50 min-h-[48px]"
            >
              {submitting ? '...' : t('pricing_modal_done')}
            </button>
          </motion.div>
        </div>
      )}

      <footer className="py-12 border-t border-border text-center text-muted text-sm">
        {t('footer_copyright')}
      </footer>
    </div>
  );
};
