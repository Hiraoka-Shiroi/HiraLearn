import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Subscription, SubscriptionPlan } from '@/types/database';

interface SubscriptionState {
  subscription: Subscription | null;
  loading: boolean;
  fetchSubscription: (userId: string) => Promise<void>;
  hasAccess: (requiredPlan: SubscriptionPlan) => boolean;
  submitPayment: (userId: string, plan: SubscriptionPlan, email: string) => Promise<void>;
}

const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  free: 0,
  student: 1,
  pro: 2,
  lifetime: 3,
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  loading: true,

  fetchSubscription: async (userId: string) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      set({ subscription: null, loading: false });
      return;
    }

    set({ subscription: data as Subscription | null, loading: false });
  },

  hasAccess: (requiredPlan: SubscriptionPlan) => {
    const { subscription } = get();
    if (!subscription || subscription.status !== 'active') {
      return requiredPlan === 'free';
    }

    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      return requiredPlan === 'free';
    }

    return PLAN_HIERARCHY[subscription.plan] >= PLAN_HIERARCHY[requiredPlan];
  },

  submitPayment: async (userId: string, plan: SubscriptionPlan, email: string) => {
    const expiresAt = plan === 'lifetime'
      ? null
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan,
        status: 'pending',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        payment_method: 'kaspi',
        payment_reference: `kaspi-${email}-${Date.now()}`,
      }, { onConflict: 'user_id' });

    if (error) {
      throw new Error(error.message);
    }

    await get().fetchSubscription(userId);
  },
}));
