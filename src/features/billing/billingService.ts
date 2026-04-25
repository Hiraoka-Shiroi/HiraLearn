import { supabase } from '@/lib/supabase/client';
import { Subscription, SubscriptionPlan } from '@/types/database';

export interface PlanDetails {
  id: SubscriptionPlan;
  price: string;
  priceNum: number;
  description: string;
  features: string[];
  isMonthly: boolean;
}

export const PLANS: Record<Exclude<SubscriptionPlan, 'free'>, PlanDetails> = {
  student: {
    id: 'student',
    price: '7 500',
    priceNum: 7500,
    description: 'Подписка HiraLearn: Ученик',
    features: [
      'Доступ к 12+ модулям',
      'AI Ментор (базовый)',
      'Сертификат начального уровня',
      'Доступ к сообществу',
    ],
    isMonthly: true,
  },
  pro: {
    id: 'pro',
    price: '14 500',
    priceNum: 14500,
    description: 'Подписка HiraLearn: Мастер',
    features: [
      'Приоритетный AI Сэнсэй 24/7',
      'Профессиональный сертификат',
      'Доступ к сети вакансий',
      'Ревью вашего кода экспертами',
      'Ранний доступ к новым курсам',
    ],
    isMonthly: true,
  },
  lifetime: {
    id: 'lifetime',
    price: '95 000',
    priceNum: 95000,
    description: 'HiraLearn: Пожизненный доступ',
    features: [
      'Пожизненный доступ ко всему',
      'Бейдж основателя',
      'Закрытый Discord-канал',
      'Индивидуальная вводная сессия',
      'Все будущие курсы — бесплатно',
    ],
    isMonthly: false,
  },
};

export const KASPI_PHONE = '+7 708 261 77 89';

export const billingService = {
  async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as Subscription | null;
  },

  async activateSubscription(userId: string, plan: SubscriptionPlan): Promise<void> {
    const expiresAt = plan === 'lifetime'
      ? null
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: 'user_id' });

    if (error) throw error;
  },

  isExpired(subscription: Subscription): boolean {
    if (!subscription.expires_at) return false;
    return new Date(subscription.expires_at) < new Date();
  },

  getActivePlan(subscription: Subscription | null): SubscriptionPlan {
    if (!subscription) return 'free';
    if (subscription.status !== 'active') return 'free';
    if (this.isExpired(subscription)) return 'free';
    return subscription.plan;
  },
};
