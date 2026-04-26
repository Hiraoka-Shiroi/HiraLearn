import { supabase } from '@/lib/supabase/client';

export interface AIResponse {
  feedback: string;
  success: boolean;
}

export const aiService = {
  /**
   * Invokes the 'get-sensei-feedback' edge function for AI code review
   */
  async getFeedback(userMessage: string, userCode: string, context?: Record<string, unknown>): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('get-sensei-feedback', {
        body: {
          message: userMessage,
          code: userCode,
          context: context || {}
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        return "Произошла ошибка при подключении к AI. Попробуйте ещё раз или проверьте структуру кода.";
      }

      return data?.feedback || "Запрос получен, но ответ пока недоступен.";
    } catch (err) {
      console.error('AI Service fetch error:', err);
      return "Произошла техническая ошибка. Попробуйте позже.";
    }
  }
};
