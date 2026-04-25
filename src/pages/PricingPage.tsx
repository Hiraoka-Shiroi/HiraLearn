import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldCheck, Zap, Award, Users, Rocket, CreditCard, Phone, X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';
import { PLANS, KASPI_PHONE } from '@/features/billing/billingService';
import { SubscriptionPlan } from '@/types/database';

interface PlanCard {
  id: Exclude<SubscriptionPlan, 'free'>;
  icon: React.ReactNode;
  highlight: boolean;
}

const planCards: PlanCard[] = [
  { id: 'student', icon: <Users className="text-accent-primary" />, highlight: false },
  { id: 'pro', icon: <Rocket className="text-accent-success" />, highlight: true },
  { id: 'lifetime', icon: <Award className="text-accent-warning" />, highlight: false },
];

export const PricingPage = () => {
  const { user } = useAuthStore();
  const { subscription, pendingRequest, fetchSubscription, submitPayment } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<Exclude<SubscriptionPlan, 'free'> | null>(null);
  const [paymentStep, setPaymentStep] = useState<'choose' | 'instructions' | 'confirm' | 'success'>('choose');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (user) {
      fetchSubscription(user.id);
    }
  }, [user, fetchSubscription]);

  const currentPlan = (() => {
    if (!subscription || subscription.status !== 'active') return 'free';
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) return 'free';
    return subscription.plan;
  })();

  const handleSelectPlan = (planId: Exclude<SubscriptionPlan, 'free'>) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedPlan(planId);
    setPaymentStep('instructions');
    setError(null);
  };

  const handleConfirmPayment = async () => {
    if (!user || !selectedPlan) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitPayment(user.id, selectedPlan, user.email || '');
      setPaymentStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setPaymentStep('choose');
    setError(null);
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

          {user && currentPlan !== 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 inline-flex items-center gap-2 bg-accent-success/10 text-accent-success px-6 py-3 rounded-full text-sm font-bold"
            >
              <CheckCircle2 size={18} />
              Ваш план: {currentPlan.toUpperCase()}
              {subscription?.expires_at && (
                <span className="text-accent-success/60 ml-2">
                  до {new Date(subscription.expires_at).toLocaleDateString('ru-RU')}
                </span>
              )}
            </motion.div>
          )}

          {user && pendingRequest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center gap-2 bg-accent-warning/10 text-accent-warning px-6 py-3 rounded-full text-sm font-bold"
            >
              <Clock size={18} />
              Ожидает подтверждения: {pendingRequest.requested_plan.toUpperCase()} ({pendingRequest.amount.toLocaleString()} ₸)
            </motion.div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {planCards.map((card, i) => {
            const plan = PLANS[card.id];
            const isCurrentPlan = currentPlan === card.id;
            const hasPendingRequest = pendingRequest?.requested_plan === card.id;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-[2.5rem] border transition-all ${
                  card.highlight
                    ? 'bg-card border-accent-success shadow-2xl shadow-accent-success/10 scale-105 z-10'
                    : 'bg-card border-border hover:border-muted'
                } ${isCurrentPlan ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-background' : ''}`}
              >
                {card.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-success text-background text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    {t('pricing_recommended')}
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-6 bg-accent-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    Ваш план
                  </div>
                )}

                <div className="mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center mb-6">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{plan.description.split(': ')[1]}</h3>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-bold">{plan.price} ₸</span>
                    <span className="text-muted text-sm">{plan.isMonthly ? '/мес' : ''}</span>
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
                  onClick={() => handleSelectPlan(card.id)}
                  disabled={isCurrentPlan || hasPendingRequest}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-accent-primary/10 text-accent-primary cursor-default'
                      : hasPendingRequest
                        ? 'bg-accent-warning/10 text-accent-warning cursor-default'
                        : card.highlight
                          ? 'bg-accent-success text-background hover:scale-[1.02]'
                          : 'bg-background border border-border hover:bg-border'
                  }`}
                >
                  {isCurrentPlan ? (
                    <><CheckCircle2 size={18} /> Активен</>
                  ) : hasPendingRequest ? (
                    <><Clock size={18} /> Ожидает</>
                  ) : (
                    <><CreditCard size={18} /> Оплатить</>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Trust badges */}
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

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full shadow-2xl relative"
            >
              <button
                onClick={closeModal}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-border transition-colors"
              >
                <X size={20} />
              </button>

              {paymentStep === 'instructions' && (
                <>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Phone className="text-accent-primary" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{t('pricing_page_kaspi')}</h2>
                    <p className="text-muted text-sm">{t('pricing_payment_instructions')}:</p>
                  </div>

                  <div className="bg-background border border-border rounded-2xl p-6 mb-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted text-sm">Тариф:</span>
                      <span className="font-bold">{PLANS[selectedPlan].description.split(': ')[1]}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted text-sm">Сумма:</span>
                      <span className="font-bold text-2xl text-accent-primary">{PLANS[selectedPlan].price} ₸</span>
                    </div>
                    {PLANS[selectedPlan].isMonthly && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted text-sm">Период:</span>
                        <span className="text-sm flex items-center gap-1"><Clock size={14} /> 30 дней</span>
                      </div>
                    )}
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
                    onClick={() => setPaymentStep('confirm')}
                    className="w-full bg-accent-success text-background py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all"
                  >
                    Я перевёл оплату →
                  </button>
                </>
              )}

              {paymentStep === 'confirm' && (
                <>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-accent-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="text-accent-warning" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Подтверждение</h2>
                    <p className="text-muted text-sm">
                      Вы уверены, что перевели <b>{PLANS[selectedPlan].price} ₸</b> на номер <b>{KASPI_PHONE}</b>?
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={handleConfirmPayment}
                      disabled={submitting}
                      className="w-full bg-accent-primary text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                      {submitting ? 'Отправка...' : 'Да, подтверждаю оплату'}
                    </button>
                    <button
                      onClick={() => setPaymentStep('instructions')}
                      className="w-full bg-background border border-border py-3 rounded-2xl text-sm hover:bg-border transition-all"
                    >
                      ← Назад к инструкции
                    </button>
                  </div>
                </>
              )}

              {paymentStep === 'success' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-accent-success/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-accent-success" size={48} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Заявка отправлена!</h2>
                  <p className="text-muted text-sm mb-8">
                    Ваша подписка <b>{PLANS[selectedPlan].description.split(': ')[1]}</b> будет активирована в течение 24 часов после проверки оплаты.
                  </p>
                  <button
                    onClick={closeModal}
                    className="w-full bg-accent-primary text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all"
                  >
                    Отлично!
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-border text-center text-muted text-sm">
        {t('footer_copyright')}
      </footer>
    </div>
  );
};
