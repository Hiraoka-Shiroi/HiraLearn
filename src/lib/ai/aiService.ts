import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/i18n/useLanguage';

export interface AIResponse {
  feedback: string;
  success: boolean;
}

export const aiService = {
  /**
   * Invokes the 'get-sensei-feedback' edge function for AI code review
   */
  async getFeedback(userMessage: string, userCode: string, context?: Record<string, unknown>): Promise<string> {
    const t = useLanguage.getState().t;
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
        return t('ai_error_connection');
      }

      return data?.feedback || t('ai_error_no_response');
    } catch (err) {
      console.error('AI Service fetch error:', err);
      return t('ai_error_technical');
    }
  }
};
