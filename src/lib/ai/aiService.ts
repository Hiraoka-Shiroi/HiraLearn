import { supabase } from '@/lib/supabase/client';

export interface AIResponse {
  feedback: string;
  success: boolean;
}

export const aiService = {
  /**
   * Invokes the 'get-sensei-feedback' edge function
   */
  async getFeedback(userMessage: string, userCode: string, context?: any): Promise<string> {
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
        return "I apologize, but my connection to the spiritual realm is currently weak. Please try again or check your code structure.";
      }

      return data?.feedback || "I have observed your request, but I have no words at this moment.";
    } catch (err) {
      console.error('AI Service fetch error:', err);
      return "The path is blocked by a technical obstacle. Even a Sensei sometimes faces connectivity issues.";
    }
  }
};
