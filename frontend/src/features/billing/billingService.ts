import { supabase } from '@/lib/supabase/client';

export const billingService = {
  getPaymentInfo(planId: 'student' | 'pro' | 'lifetime') {
    const prices = {
      student: '7 500',
      pro: '14 500',
      lifetime: '95 000'
    };

    const descriptions = {
      student: 'Подписка HiraLearn: Ученик',
      pro: 'Подписка HiraLearn: Мастер',
      lifetime: 'HiraLearn: Пожизненный доступ'
    };

    return {
      description: descriptions[planId],
      price: prices[planId],
      currency: 'KZT',
      kaspiPhone: '+7 708 261 77 89',
    };
  },

  async getSubscription(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
