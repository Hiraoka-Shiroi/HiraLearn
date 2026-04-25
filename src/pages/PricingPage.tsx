import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Zap, Award, Users, Rocket, CreditCard, Phone, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';
import { trackEvent } from '@/lib/firebase/analytics';
import { isPaddleConfigured, openPaddleCheckout } from '@/lib/paddle/client';

const KASPI_PHONE = '+7 708 261 77 89';

interface PlanInfo {
  id: 'student' | 'pro' | 'lifetime';
  nameKey: string;
  price: string;
  icon: React.ReactNode;
  features: string[];
  highlight: boolean;
  ctaKey: string;
}

const plans: PlanInfo[] = [
  {
    id: 'student',
    nameKey: 'Student',
    price: '7 500',
    icon: <Users className="text-accent-primary" />,
    features: [
      'Доступ к 12+ модулям',
      'AI Ментор (базовый)',
      'Сертификат начального уровня',
      'Доступ к сообществу'
    ],
    highlight: false,
    ctaKey: 'Начать обучение'
  },
  {
    id: 'pro',
    nameKey: 'Master (Pro)',
    price: '14 500',
    icon: <Rocket className="text-accent-success" />,
    features: [
      'Приоритетный AI Сэнсэй 24/7',
      'Профессиональный сертификат',
      'Доступ к сети вакансий',
      'Ревью вашего кода экспертами',
      'Ранний доступ к новым курсам'
    ],
    highlight: true,
    ctaKey: 'Стать Мастером'
  },
  {
    id: 'lifetime',
    nameKey: 'Early Access',
    price: '95 000',
    icon: <Award className="text-accent-warning" />,
    features: [
      'Пожизненный доступ ко всему',
      'Бейдж основателя',
      'Закрытый Discord-канал',
      'Индивидуальная вводная сессия',
      'Все будущие курсы — бесплатно'
    ],
    highlight: false,
    ctaKey: 'Купить навсегда'
  }
];

export const PricingPage = () => {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);
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

      <main className="container mx-auto px-6 pt-32 pb-24">
        <div className="text-center mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            {t('pricing_page_title')} <span className="text-accent-primary">{t('pricing_page_title_accent')}</span>.
          </motion.h1>
          <p className="text-muted max-w-2xl mx-auto text-lg">
            {t('pricing_page_subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.nameKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-[2.5rem] border transition-all ${
                plan.highlight
                  ? 'bg-card border-accent-success shadow-2xl shadow-accent-success/10 scale-105 z-10'
                  : 'bg-card border-border hover:border-muted'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-success text-background text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {t('pricing_recommended')}
                </div>
              )}

              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center mb-6">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{plan.nameKey}</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-bold">{plan.price} ₸</span>
                  <span className="text-muted text-sm">{plan.id !== 'lifetime' && '/мес'}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start text-sm">
                    <Check className="text-accent-success mr-3 mt-0.5 shrink-0" size={16} />
                    <span className="text-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => { void handlePurchase(plan); }}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                plan.highlight
                  ? 'bg-accent-success text-background hover:scale-[1.02]'
                  : 'bg-background border border-border hover:bg-border'
              }`}>
                <CreditCard size={18} />
                {plan.ctaKey}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Security / Trust */}
        <div className="mt-24 pt-12 border-t border-border flex flex-col md:flex-row items-center justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full shadow-2xl relative"
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
                <span className="text-muted text-sm">Тариф:</span>
                <span className="font-bold">{selectedPlan.nameKey}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">Сумма:</span>
                <span className="font-bold text-2xl text-accent-primary">{selectedPlan.price} ₸</span>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-muted text-xs mb-2 uppercase font-bold tracking-widest">Kaspi перевод на номер:</p>
                <p className="text-2xl font-black text-accent-success tracking-wider text-center py-2">
                  {KASPI_PHONE}
                </p>
              </div>
            </div>

            <div className="bg-accent-warning/5 border border-accent-warning/20 rounded-2xl p-4 mb-6">
              <p className="text-xs text-accent-warning leading-relaxed">
                <b>Важно:</b> В комментарии к переводу укажите ваш email ({user?.email || 'ваш email'}), чтобы мы могли активировать подписку. Активация происходит в течение 24 часов.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedPlan(null);
                alert(t('pricing_payment_success'));
              }}
              className="w-full bg-accent-success text-background py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all"
            >
              Я перевёл оплату
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
