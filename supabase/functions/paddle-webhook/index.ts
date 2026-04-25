// Supabase Edge Function: paddle-webhook
//
// Receives Paddle Billing webhook events, verifies the HMAC signature,
// upserts `subscriptions`, and appends `payments` rows used by the admin
// Revenue widget.
//
// Required secrets (set via `supabase secrets set ...`):
//   - PADDLE_WEBHOOK_SECRET   — Notification secret from Paddle dashboard.
//   - SUPABASE_URL            — Auto-injected.
//   - SUPABASE_SERVICE_ROLE_KEY — Auto-injected.
//
// Deploy:
//   supabase functions deploy paddle-webhook --no-verify-jwt
//   supabase secrets set PADDLE_WEBHOOK_SECRET=...

// @ts-expect-error -- Deno-only import resolved at deploy time.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error -- Deno-only import resolved at deploy time.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  env: { get(key: string): string | undefined };
};

const env = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
};

const verifySignature = async (
  rawBody: string,
  header: string,
  secret: string,
): Promise<boolean> => {
  // Paddle Notification-Signature header: "ts=<unix>;h1=<hex>"
  const parts = Object.fromEntries(
    header.split(';').map((p) => {
      const [k, v] = p.split('=');
      return [k.trim(), (v ?? '').trim()];
    }),
  );
  const ts = parts['ts'];
  const expected = parts['h1'];
  if (!ts || !expected) return false;

  const data = `${ts}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (computed.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
};

interface PaddleEventBody {
  event_id?: string;
  event_type?: string;
  data?: {
    id?: string;
    customer_id?: string;
    status?: string;
    current_billing_period?: { ends_at?: string };
    items?: Array<{ price?: { id?: string }; quantity?: number }>;
    custom_data?: { user_id?: string; plan?: string };
    details?: {
      totals?: { total?: string; currency_code?: string };
    };
  };
}

const planFromCustomData = (
  customData: Record<string, unknown> | undefined,
): 'student' | 'pro' | 'lifetime' | null => {
  const plan = customData?.['plan'];
  if (plan === 'student' || plan === 'pro' || plan === 'lifetime') return plan;
  return null;
};

const subscriptionStatus = (
  paddleStatus: string | undefined,
): 'pending' | 'active' | 'past_due' | 'canceled' | 'expired' => {
  switch (paddleStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'paused':
    case 'expired':
      return 'expired';
    default:
      return 'pending';
  }
};

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get('paddle-signature') ?? '';
  const secret = env('PADDLE_WEBHOOK_SECRET');

  const ok = await verifySignature(rawBody, sigHeader, secret);
  if (!ok) {
    return new Response('Invalid signature', { status: 401 });
  }

  let body: PaddleEventBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

  const data = body.data ?? {};
  const userId = data.custom_data?.user_id ?? null;
  const plan = planFromCustomData(data.custom_data);

  try {
    if (
      body.event_type === 'subscription.activated' ||
      body.event_type === 'subscription.updated' ||
      body.event_type === 'subscription.canceled'
    ) {
      if (!userId || !plan) {
        return new Response('Missing custom_data.user_id/plan', { status: 400 });
      }
      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          plan,
          status: subscriptionStatus(data.status),
          provider: 'paddle',
          provider_customer_id: data.customer_id ?? null,
          provider_subscription_id: data.id ?? null,
          current_period_end: data.current_billing_period?.ends_at ?? null,
        },
        { onConflict: 'user_id' },
      );
    }

    if (body.event_type === 'transaction.completed') {
      const total = data.details?.totals?.total;
      const currency = data.details?.totals?.currency_code ?? 'KZT';
      const amount = total ? Number(total) / 100 : 0;

      // Resolve subscription_id if we already have one for this user.
      let subscriptionId: string | null = null;
      if (userId) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        subscriptionId = sub?.id ?? null;
      }

      await supabase.from('payments').upsert(
        {
          user_id: userId,
          subscription_id: subscriptionId,
          provider: 'paddle',
          provider_event_id: body.event_id ?? data.id ?? null,
          amount,
          currency,
          status: 'completed',
          raw_payload: body as unknown as Record<string, unknown>,
        },
        { onConflict: 'provider_event_id' },
      );
    }
  } catch (e) {
    console.error('paddle-webhook error:', e);
    return new Response('Internal error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
