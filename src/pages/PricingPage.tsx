
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Zap, Award, Users, Rocket, Loader2, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { billingService } from '@/features/billing/billingService';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    id: "student",
    name: "Student",
    price: "7 500",
    icon: <Users className="text-accent-primary" />,
    features: [
      "Доступ к 12+ модулям",
      "AI Ментор (базовый)",
      "Сертификат начального уровня",
      "Доступ к сообществу"
    ],
    highlight: false,
    cta: "Начать обучение"
  },
  {
    id: "pro",
    name: "Master (Pro)",
    price: "14 500",
    icon: <Rocket className="text-accent-success" />,
    features: [
      "Приоритетный AI Сэнсэй 24/7",
      "Профессиональный сертификат",
      "Доступ к сети вакансий",
      "Ревью вашего кода экспертами",
      "Ранний доступ к новым курсам"
    ],
    highlight: true,
    cta: "Стать Мастером"
  },
  {
    id: "lifetime",
    name: "Early Access",
    price: "95 000",
    icon: <Award className="text-accent-warning" />,
    features: [
      "Пожизненный доступ ко всему",
      "Бейдж основателя",
      "Закрытый Discord-канал",
      "Индивидуальная вводная сессия",
      "Все будущие курсы — бесплатно"
    ],
    highlight: false,
    cta: "Купить навсегда"
  }
] as const;

export const PricingPage = () => {
  const { user } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Подгружаем скрипт CloudPayments для Казахстана
    const script = document.createElement('script');
    script.src = 'https://widget.cloudpayments.kz/bundles/cloudpayments.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const handlePurchase = async (planId: 'student' | 'pro' | 'lifetime') => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoadingPlan(planId);
    try {
      const paymentData = await billingService.getPaymentLink(planId, user.id, user.email || '');

      // Вызываем виджет CloudPayments.kz
      // @ts-ignore
      const widget = new cp.CloudPayments();
      widget.pay('auth', paymentData, {
        onSuccess: (options: any) => {
          console.log('Payment success', options);
          alert("Оплата прошла успешно! Ваша подписка активируется в течение пары минут.");
          navigate('/dashboard');
        },
        onFail: (reason: any, options: any) => {
          console.error('Payment failed', reason, options);
          alert("Оплата не удалась: " + reason);
        }
      });
    } catch (error) {
      console.error("Payment widget failed:", error);
      alert("Ошибка при запуске платежного модуля.");
    } finally {
      setLoadingPlan(null);
    }
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
            Инвестируй в свое <span className="text-accent-primary">Мастерство</span>.
          </motion.h1>
          <p className="text-muted max-w-2xl mx-auto text-lg">
            Цены указаны в <b>тенге (KZT)</b>. Мы поддерживаем оплату любыми картами Казахстана.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
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
                  Рекомендуем
                </div>
              )}

              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center mb-6">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
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
                onClick={() => handlePurchase(plan.id)}
                disabled={loadingPlan !== null}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                plan.highlight
                  ? 'bg-accent-success text-background hover:scale-[1.02]'
                  : 'bg-background border border-border hover:bg-border'
              }`}>
                {loadingPlan === plan.id ? <Loader2 className="animate-spin" /> : (
                  <>
                    <CreditCard size={18} />
                    {plan.cta}
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Security / Trust */}
        <div className="mt-24 pt-12 border-t border-border flex flex-col md:flex-row items-center justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Безопасная оплата (PCI DSS)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Мгновенная активация</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase">
             🇰🇿 Оплата в тенге
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-border text-center text-muted text-sm">
        © 2026 HiraLearn. Сделано для будущих мастеров фронтенда.
      </footer>
    </div>
  );
};
