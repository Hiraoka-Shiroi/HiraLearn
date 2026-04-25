import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Subscription, SubscriptionPlan, PaymentRequest } from '@/types/database';

interface SubscriptionState {
  subscription: Subscription | null;
  pendingRequest: PaymentRequest | null;
  loading: boolean;
  fetchSubscription: (userId: string) => Promise<void>;
  hasAccess: (requiredPlan: SubscriptionPlan) => boolean;
  submitPayment: (userId: string, plan: Exclude<SubscriptionPlan, 'free'>, email: string) => Promise<void>;
}

const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  free: 0,
  student: 1,
  pro: 2,
  lifetime: 3,
};

const PLAN_PRICES: Record<Exclude<SubscriptionPlan, 'free'>, number> = {
  student: 7500,
  pro: 14500,
  lifetime: 95000,
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  pendingRequest: null,
  loading: true,

  fetchSubscription: async (userId: string) => {
    set({ loading: true });

    const [subResult, reqResult] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (subResult.error) {
      console.error('Error fetching subscription:', subResult.error);
    }
    if (reqResult.error) {
      console.error('Error fetching payment request:', reqResult.error);
    }

    set({
      subscription: (subResult.data as Subscription | null) ?? null,
      pendingRequest: (reqResult.data as PaymentRequest | null) ?? null,
      loading: false,
    });
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

  submitPayment: async (userId: string, plan: Exclude<SubscriptionPlan, 'free'>, email: string) => {
    const { error } = await supabase
      .from('payment_requests')
      .insert({
        user_id: userId,
        requested_plan: plan,
        amount: PLAN_PRICES[plan],
        payment_method: 'kaspi',
        payment_reference: `kaspi-${email}-${Date.now()}`,
      });

    if (error) {
      throw new Error(error.message);
    }

    await get().fetchSubscription(userId);
  },
}));
