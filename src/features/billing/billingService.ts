
import { supabase } from '@/lib/supabase/client';

export const billingService = {
  /**
   * Для Казахстана лучше всего использовать CloudPayments.kz или Kaspi Pay.
   * Для MVP мы подготовили интеграцию с CloudPayments, так как она проще автоматизируется.
   */
  async getPaymentLink(planId: 'student' | 'pro' | 'lifetime', userId: string, userEmail: string) {
    // Цены в тенге (KZT)
    const prices = {
      student: 7500,  // Примерно $15
      pro: 14500,     // Примерно $29
      lifetime: 95000 // Примерно $199
    };

    const descriptions = {
      student: 'Подписка HiraLearn: Ученик',
      pro: 'Подписка HiraLearn: Мастер',
      lifetime: 'HiraLearn: Пожизненный доступ'
    };

    // В будущем здесь будет вызов CloudPayments SDK.
    // Сейчас мы возвращаем объект данных для виджета.
    return {
      publicId: 'test_api_00000000000000000000001', // ЗАМЕНИТЕ НА ВАШ Public ID из CloudPayments.kz
      description: descriptions[planId],
      amount: prices[planId],
      currency: 'KZT',
      accountId: userEmail,
      data: {
        userId: userId,
        planId: planId
      }
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
