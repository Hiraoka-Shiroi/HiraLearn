import { initializePaddle, Paddle } from '@paddle/paddle-js';
import type { SubscriptionPlan } from '@/types/database';

const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
const environment =
  (import.meta.env.VITE_PADDLE_ENVIRONMENT as 'sandbox' | 'production' | undefined) ??
  'sandbox';

const priceIds: Record<SubscriptionPlan, string | undefined> = {
  student: import.meta.env.VITE_PADDLE_PRICE_STUDENT,
  pro: import.meta.env.VITE_PADDLE_PRICE_PRO,
  lifetime: import.meta.env.VITE_PADDLE_PRICE_LIFETIME,
};

export const isPaddleConfigured = Boolean(
  clientToken && Object.values(priceIds).some(Boolean),
);

let paddleInstance: Paddle | null = null;
let initPromise: Promise<Paddle | null> | null = null;

const init = (): Promise<Paddle | null> => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (!clientToken) return null;
    try {
      const paddle = await initializePaddle({ environment, token: clientToken });
      paddleInstance = paddle ?? null;
      return paddleInstance;
    } catch (e) {
      console.warn('Paddle init failed:', e);
      return null;
    }
  })();
  return initPromise;
};

interface OpenCheckoutOptions {
  plan: SubscriptionPlan;
  email?: string;
  userId?: string;
}

export const openPaddleCheckout = async ({
  plan,
  email,
  userId,
}: OpenCheckoutOptions): Promise<boolean> => {
  const paddle = await init();
  const priceId = priceIds[plan];
  if (!paddle || !priceId) return false;

  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: email ? { email } : undefined,
    customData: userId ? { user_id: userId, plan } : { plan },
  });
  return true;
};
