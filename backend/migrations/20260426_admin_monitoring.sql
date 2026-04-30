-- HiraLearn Admin Monitoring & Billing Schema
-- Adds: error_logs, page_metrics, subscriptions, payments

-- 1. Error Logs ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  browser TEXT,
  os TEXT,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON public.error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_user_id_idx ON public.error_logs (user_id);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can insert their own error rows. Stack traces never include secrets.
DROP POLICY IF EXISTS "anyone can insert error logs" ON public.error_logs;
CREATE POLICY "anyone can insert error logs" ON public.error_logs
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read error logs.
DROP POLICY IF EXISTS "admins can read error logs" ON public.error_logs;
CREATE POLICY "admins can read error logs" ON public.error_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- 2. Page Metrics (System Pulse) ------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  load_time_ms INTEGER NOT NULL,
  dom_content_loaded_ms INTEGER,
  ttfb_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS page_metrics_created_at_idx ON public.page_metrics (created_at DESC);

ALTER TABLE public.page_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can insert page metrics" ON public.page_metrics;
CREATE POLICY "anyone can insert page metrics" ON public.page_metrics
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "admins can read page metrics" ON public.page_metrics;
CREATE POLICY "admins can read page metrics" ON public.page_metrics
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- 3. Subscriptions --------------------------------------------------------
-- Holds the current state of a user's subscription (one row per user).
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('student', 'pro', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'past_due', 'canceled', 'expired')),
  provider TEXT NOT NULL DEFAULT 'paddle',
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions (status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can view own subscription" ON public.subscriptions;
CREATE POLICY "users can view own subscription" ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins can read all subscriptions" ON public.subscriptions;
CREATE POLICY "admins can read all subscriptions" ON public.subscriptions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- 4. Payments -------------------------------------------------------------
-- Append-only log of every successful charge (used for Revenue widget).
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'paddle',
  provider_event_id TEXT UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KZT',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'failed')),
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_created_at_idx ON public.payments (created_at DESC);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can view own payments" ON public.payments;
CREATE POLICY "users can view own payments" ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins can read all payments" ON public.payments;
CREATE POLICY "admins can read all payments" ON public.payments
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- 5. Touch trigger for subscriptions --------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_touch_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_touch_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. last_active_at on profiles -------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS profiles_last_active_at_idx ON public.profiles (last_active_at DESC);

-- 7. Admin-friendly user list view ----------------------------------------
-- profile rows + auth.users.email; readable by admins only via RLS on the underlying tables.
CREATE OR REPLACE VIEW public.admin_user_list
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.username,
  p.full_name,
  p.role,
  p.level,
  p.xp,
  p.last_active_at,
  p.created_at,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;
