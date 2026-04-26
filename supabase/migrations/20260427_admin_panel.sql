-- HiraLearn — Admin Panel: Roles, Subscriptions, Push Notifications, Audit Logs
-- This migration is idempotent and safe to re-run.
--
-- Adds:
--   * Expanded role hierarchy: user / moderator / admin / super_admin
--   * profiles.status (active/banned/deleted), profiles.email (denormalized)
--   * subscriptions: plan = free/premium/pro/lifetime + starts_at, ends_at, issued_by, reason
--   * push_tokens, admin_logs, notifications tables
--   * Helper functions: is_admin, has_role, role_rank
--   * SECURITY DEFINER RPCs: admin_list_users, admin_set_user_role,
--       admin_set_user_status, admin_grant_subscription, admin_revoke_subscription,
--       admin_register_push_token, admin_send_notification_record, admin_expire_subscriptions
--   * RLS policies: only admin/super_admin can read sensitive tables, mutations go via RPCs
--
-- IMPORTANT: This migration backfills `admin` -> `super_admin` and `student` -> `user`.

-- -----------------------------------------------------------------------------
-- 1. Profiles: extended role / status / email / last_seen_at
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  -- Older databases may not have last_active_at (was introduced by an
  -- optional monitoring migration). Add it here so the COALESCE backfill
  -- below and the admin views below never fail with "column does not exist".
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Stub tables used by admin_dashboard_summary. If the optional monitoring
-- migration (20260426) is applied later, these CREATE TABLE IF NOT EXISTS
-- become no-ops; if not, the dashboard simply reports 0 for the missing
-- metrics instead of erroring out.
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.page_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.page_metrics ENABLE ROW LEVEL SECURITY;

-- No SELECT policy is added here intentionally: with RLS enabled and no
-- policy, only service_role / SECURITY DEFINER functions can read these
-- tables. The dashboard RPC reads them via SECURITY DEFINER, so it works,
-- but unauthenticated PostgREST traffic is denied by default.

-- Drop old role check (only allowed student/admin)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Backfill old role values BEFORE adding new constraint
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.profiles SET role = 'user'        WHERE role = 'student';
UPDATE public.profiles SET role = 'user'        WHERE role IS NULL;

-- Backfill status / last_seen_at
UPDATE public.profiles SET status = 'active' WHERE status IS NULL;
UPDATE public.profiles SET last_seen_at = COALESCE(last_seen_at, last_active_at, updated_at, created_at, NOW());

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'user',
  ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('user', 'moderator', 'admin', 'super_admin'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
    CHECK (status IN ('active', 'banned', 'deleted'));

CREATE INDEX IF NOT EXISTS profiles_role_idx       ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_status_idx     ON public.profiles (status);
CREATE INDEX IF NOT EXISTS profiles_email_idx      ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_last_seen_idx  ON public.profiles (last_seen_at DESC);

-- Backfill email from auth.users (one-shot; trigger keeps it fresh)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND (p.email IS NULL OR p.email <> u.email);

-- Update handle_new_user trigger to also fill email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'user',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Keep email in sync if auth.users.email changes
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- 2. Role helper functions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.role_rank(role_name TEXT)
RETURNS INT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE role_name
    WHEN 'super_admin' THEN 4
    WHEN 'admin'       THEN 3
    WHEN 'moderator'   THEN 2
    WHEN 'user'        THEN 1
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(min_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT public.role_rank(p.role) >= public.role_rank(min_role)
     FROM public.profiles p
     WHERE p.id = auth.uid()),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role('admin');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role('super_admin');
$$;

GRANT EXECUTE ON FUNCTION public.role_rank(TEXT)     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin()    TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Subscriptions: extended plans + admin metadata
-- -----------------------------------------------------------------------------

-- Stub the subscriptions table for older databases that didn't apply
-- 20260426_admin_monitoring.sql. CREATE TABLE IF NOT EXISTS is a no-op
-- when the table already exists.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
    CHECK (plan IN ('free', 'student', 'premium', 'pro', 'lifetime'));

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ends_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reason    TEXT;

-- Mirror existing current_period_end into ends_at (one-shot)
UPDATE public.subscriptions
SET ends_at = current_period_end
WHERE ends_at IS NULL AND current_period_end IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. Push tokens
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  platform    TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'ios', 'android')),
  device_info JSONB,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx   ON public.push_tokens (user_id);
CREATE INDEX IF NOT EXISTS push_tokens_is_active_idx ON public.push_tokens (is_active);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can view own push tokens"   ON public.push_tokens;
DROP POLICY IF EXISTS "users can insert own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "users can update own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "users can delete own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "admins can read all push tokens"  ON public.push_tokens;

CREATE POLICY "users can view own push tokens"   ON public.push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own push tokens" ON public.push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own push tokens" ON public.push_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own push tokens" ON public.push_tokens FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "admins can read all push tokens"  ON public.push_tokens FOR SELECT USING (public.is_admin());

-- Touch trigger helper: bumps updated_at on every UPDATE.
-- Defined here as well so this migration is self-sufficient (older databases
-- that didn't apply 20260426_admin_monitoring.sql also need it).
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS push_tokens_touch_updated_at ON public.push_tokens;
CREATE TRIGGER push_tokens_touch_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Admin logs (audit trail)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  old_value       JSONB,
  new_value       JSONB,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx     ON public.admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx       ON public.admin_logs (admin_id);
CREATE INDEX IF NOT EXISTS admin_logs_target_user_idx    ON public.admin_logs (target_user_id);
CREATE INDEX IF NOT EXISTS admin_logs_action_idx         ON public.admin_logs (action);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super admins can read admin logs" ON public.admin_logs;
CREATE POLICY "super admins can read admin logs"
  ON public.admin_logs FOR SELECT
  USING (public.is_super_admin());

-- No direct inserts; everything goes through SECURITY DEFINER RPCs.

-- -----------------------------------------------------------------------------
-- 6. Notifications (sent push journal)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  link            TEXT,
  audience        JSONB NOT NULL,
  sent_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sent_count      INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0,
  invalid_tokens  JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins can read notifications" ON public.notifications;
CREATE POLICY "admins can read notifications"
  ON public.notifications FOR SELECT
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. Profile RLS: tighten + read-own-and-by-admins
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"             ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile"               ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles minimal"  ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"             ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile data"        ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles via RPC"       ON public.profiles;

-- Authenticated users can see *their own* full profile.
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins (admin or super_admin) can see all profiles.
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Authenticated users can update only their own profile, and ONLY safe fields.
-- Fields like role/status are blocked at row level; mutations to those go via RPC.
CREATE POLICY "Users can update own profile data"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND status = (SELECT status FROM public.profiles WHERE id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 8. SECURITY DEFINER RPCs for admin actions
-- -----------------------------------------------------------------------------

-- 8.1 List users (with email + subscription) — admin only.
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search          TEXT DEFAULT NULL,
  p_role            TEXT DEFAULT NULL,
  p_status          TEXT DEFAULT NULL,
  p_plan            TEXT DEFAULT NULL,
  p_only_active_sub BOOLEAN DEFAULT NULL,
  p_sort            TEXT DEFAULT 'created_desc',
  p_limit           INT  DEFAULT 50,
  p_offset          INT  DEFAULT 0
)
RETURNS TABLE (
  id              UUID,
  email           TEXT,
  full_name       TEXT,
  username        TEXT,
  role            TEXT,
  status          TEXT,
  level           INTEGER,
  xp              INTEGER,
  created_at      TIMESTAMPTZ,
  last_seen_at    TIMESTAMPTZ,
  plan            TEXT,
  plan_active     BOOLEAN,
  plan_ends_at    TIMESTAMPTZ,
  total_count     BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search TEXT := LOWER(NULLIF(p_search, ''));
BEGIN
  IF NOT public.is_admin() AND NOT public.has_role('moderator') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id,
      COALESCE(p.email, u.email) AS email,
      p.full_name,
      p.username,
      p.role,
      p.status,
      p.level,
      p.xp,
      p.created_at,
      COALESCE(p.last_seen_at, p.last_active_at, p.updated_at) AS last_seen_at,
      s.plan,
      CASE
        WHEN s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())
          THEN TRUE
        ELSE FALSE
      END AS plan_active,
      s.ends_at AS plan_ends_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.subscriptions s ON s.user_id = p.id
  ),
  filtered AS (
    SELECT * FROM base
    WHERE (v_search IS NULL
           OR LOWER(COALESCE(email,'')) LIKE '%' || v_search || '%'
           OR LOWER(COALESCE(full_name,'')) LIKE '%' || v_search || '%'
           OR LOWER(COALESCE(username,'')) LIKE '%' || v_search || '%')
      AND (p_role IS NULL OR role = p_role)
      AND (p_status IS NULL OR status = p_status)
      AND (p_plan IS NULL OR plan = p_plan)
      AND (p_only_active_sub IS NULL OR plan_active = p_only_active_sub)
  )
  SELECT
    f.id, f.email, f.full_name, f.username, f.role, f.status,
    f.level, f.xp, f.created_at, f.last_seen_at,
    f.plan, f.plan_active, f.plan_ends_at,
    (SELECT COUNT(*) FROM filtered) AS total_count
  FROM filtered f
  ORDER BY
    CASE WHEN p_sort = 'created_desc'  THEN f.created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'created_asc'   THEN f.created_at END ASC  NULLS LAST,
    CASE WHEN p_sort = 'last_seen_desc'THEN f.last_seen_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'last_seen_asc' THEN f.last_seen_at END ASC  NULLS LAST,
    CASE WHEN p_sort = 'email_asc'     THEN f.email END ASC NULLS LAST,
    CASE WHEN p_sort = 'email_desc'    THEN f.email END DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, INT, INT) TO authenticated;

-- 8.2 Set user role (with full hierarchy enforcement).
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user UUID,
  p_new_role    TEXT,
  p_reason      TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id    UUID := auth.uid();
  v_caller_role  TEXT;
  v_target_role  TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_new_role NOT IN ('user', 'moderator', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'invalid role' USING ERRCODE = '22023';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
  SELECT role INTO v_target_role FROM public.profiles WHERE id = p_target_user;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'target not found' USING ERRCODE = 'P0002';
  END IF;

  -- Only admin+ can change roles
  IF public.role_rank(v_caller_role) < public.role_rank('admin') THEN
    RAISE EXCEPTION 'forbidden: requires admin' USING ERRCODE = '42501';
  END IF;

  -- Only super_admin can grant admin or super_admin
  IF p_new_role IN ('admin', 'super_admin') AND v_caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'forbidden: only super_admin can grant admin/super_admin' USING ERRCODE = '42501';
  END IF;

  -- Only super_admin can demote a super_admin
  IF v_target_role = 'super_admin' AND v_caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'forbidden: cannot modify super_admin' USING ERRCODE = '42501';
  END IF;

  -- A user cannot grant a role higher than their own
  IF public.role_rank(p_new_role) > public.role_rank(v_caller_role) THEN
    RAISE EXCEPTION 'forbidden: cannot grant role higher than own' USING ERRCODE = '42501';
  END IF;

  -- A user cannot change their own role (avoid self-promotion bugs)
  IF p_target_user = v_caller_id THEN
    RAISE EXCEPTION 'forbidden: cannot change your own role' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET role = p_new_role, updated_at = NOW()
  WHERE id = p_target_user;

  INSERT INTO public.admin_logs (admin_id, target_user_id, action, old_value, new_value, metadata)
  VALUES (
    v_caller_id, p_target_user, 'role.change',
    jsonb_build_object('role', v_target_role),
    jsonb_build_object('role', p_new_role),
    jsonb_build_object('reason', p_reason)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT, TEXT) TO authenticated;

-- 8.3 Set user status (block/unblock).
CREATE OR REPLACE FUNCTION public.admin_set_user_status(
  p_target_user UUID,
  p_new_status  TEXT,
  p_reason      TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id     UUID := auth.uid();
  v_caller_role   TEXT;
  v_target_role   TEXT;
  v_target_status TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_new_status NOT IN ('active', 'banned', 'deleted') THEN
    RAISE EXCEPTION 'invalid status' USING ERRCODE = '22023';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
  SELECT role, status INTO v_target_role, v_target_status FROM public.profiles WHERE id = p_target_user;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'target not found' USING ERRCODE = 'P0002';
  END IF;

  IF public.role_rank(v_caller_role) < public.role_rank('admin') THEN
    RAISE EXCEPTION 'forbidden: requires admin' USING ERRCODE = '42501';
  END IF;

  IF v_target_role = 'super_admin' AND v_caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'forbidden: cannot modify super_admin' USING ERRCODE = '42501';
  END IF;

  IF p_target_user = v_caller_id THEN
    RAISE EXCEPTION 'forbidden: cannot change your own status' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_target_user;

  INSERT INTO public.admin_logs (admin_id, target_user_id, action, old_value, new_value, metadata)
  VALUES (
    v_caller_id, p_target_user, 'status.change',
    jsonb_build_object('status', v_target_status),
    jsonb_build_object('status', p_new_status),
    jsonb_build_object('reason', p_reason)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_status(UUID, TEXT, TEXT) TO authenticated;

-- 8.4 Grant subscription
CREATE OR REPLACE FUNCTION public.admin_grant_subscription(
  p_target_user UUID,
  p_plan        TEXT,
  p_duration    TEXT,        -- '7d' | '30d' | '90d' | '365d' | 'forever'
  p_reason      TEXT DEFAULT NULL
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   UUID := auth.uid();
  v_caller_role TEXT;
  v_old_sub     public.subscriptions;
  v_new_sub     public.subscriptions;
  v_starts_at   TIMESTAMPTZ := NOW();
  v_ends_at     TIMESTAMPTZ;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

  IF public.role_rank(v_caller_role) < public.role_rank('admin') THEN
    RAISE EXCEPTION 'forbidden: requires admin' USING ERRCODE = '42501';
  END IF;

  IF p_plan NOT IN ('free', 'student', 'premium', 'pro', 'lifetime') THEN
    RAISE EXCEPTION 'invalid plan' USING ERRCODE = '22023';
  END IF;

  IF p_plan = 'lifetime' OR p_duration = 'forever' THEN
    v_ends_at := NULL;
  ELSE
    v_ends_at := CASE p_duration
      WHEN '7d'   THEN NOW() + INTERVAL '7 days'
      WHEN '30d'  THEN NOW() + INTERVAL '30 days'
      WHEN '90d'  THEN NOW() + INTERVAL '90 days'
      WHEN '365d' THEN NOW() + INTERVAL '365 days'
      ELSE NULL
    END;
    IF v_ends_at IS NULL THEN
      RAISE EXCEPTION 'invalid duration: %', p_duration USING ERRCODE = '22023';
    END IF;
  END IF;

  SELECT * INTO v_old_sub FROM public.subscriptions WHERE user_id = p_target_user;

  INSERT INTO public.subscriptions (
    user_id, plan, status, provider, starts_at, ends_at, current_period_end, issued_by, reason
  )
  VALUES (
    p_target_user, p_plan, 'active', 'manual', v_starts_at, v_ends_at, v_ends_at, v_caller_id, p_reason
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan               = EXCLUDED.plan,
    status             = 'active',
    provider           = EXCLUDED.provider,
    starts_at          = EXCLUDED.starts_at,
    ends_at            = EXCLUDED.ends_at,
    current_period_end = EXCLUDED.current_period_end,
    issued_by          = EXCLUDED.issued_by,
    reason             = EXCLUDED.reason,
    updated_at         = NOW()
  RETURNING * INTO v_new_sub;

  INSERT INTO public.admin_logs (admin_id, target_user_id, action, old_value, new_value, metadata)
  VALUES (
    v_caller_id, p_target_user, 'subscription.grant',
    CASE WHEN v_old_sub.id IS NULL THEN NULL ELSE to_jsonb(v_old_sub) END,
    to_jsonb(v_new_sub),
    jsonb_build_object('reason', p_reason, 'duration', p_duration)
  );

  RETURN v_new_sub;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_grant_subscription(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- 8.5 Revoke subscription
CREATE OR REPLACE FUNCTION public.admin_revoke_subscription(
  p_target_user UUID,
  p_reason      TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_caller_role TEXT;
  v_old_sub public.subscriptions;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

  IF public.role_rank(v_caller_role) < public.role_rank('admin') THEN
    RAISE EXCEPTION 'forbidden: requires admin' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_old_sub FROM public.subscriptions WHERE user_id = p_target_user;
  IF v_old_sub.id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.subscriptions
  SET status = 'canceled', ends_at = NOW(), current_period_end = NOW(), updated_at = NOW()
  WHERE user_id = p_target_user;

  INSERT INTO public.admin_logs (admin_id, target_user_id, action, old_value, new_value, metadata)
  VALUES (
    v_caller_id, p_target_user, 'subscription.revoke',
    to_jsonb(v_old_sub),
    NULL,
    jsonb_build_object('reason', p_reason)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_revoke_subscription(UUID, TEXT) TO authenticated;

-- 8.6 Lazy-expire subscriptions (called on read or by cron).
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND ends_at IS NOT NULL
    AND ends_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_subscriptions() TO authenticated;

-- 8.7 Register / refresh push token (called by user)
CREATE OR REPLACE FUNCTION public.register_push_token(
  p_token       TEXT,
  p_platform    TEXT DEFAULT 'web',
  p_device_info JSONB DEFAULT NULL
)
RETURNS public.push_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row  public.push_tokens;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_platform NOT IN ('web', 'ios', 'android') THEN
    RAISE EXCEPTION 'invalid platform' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.push_tokens (user_id, token, platform, device_info, is_active)
  VALUES (v_user, p_token, p_platform, p_device_info, TRUE)
  ON CONFLICT (token) DO UPDATE SET
    user_id     = EXCLUDED.user_id,
    platform    = EXCLUDED.platform,
    device_info = EXCLUDED.device_info,
    is_active   = TRUE,
    updated_at  = NOW()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_push_token(TEXT, TEXT, JSONB) TO authenticated;

-- 8.8 Resolve audience -> push tokens (admin only)
CREATE OR REPLACE FUNCTION public.admin_resolve_push_audience(
  p_audience JSONB
)
RETURNS TABLE (user_id UUID, token TEXT, platform TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type  TEXT := p_audience->>'type';
  v_value TEXT := p_audience->>'value';
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_type = 'all' THEN
    RETURN QUERY
      SELECT pt.user_id, pt.token, pt.platform
      FROM public.push_tokens pt
      JOIN public.profiles p ON p.id = pt.user_id
      WHERE pt.is_active = TRUE AND p.status = 'active';
  ELSIF v_type = 'user' THEN
    RETURN QUERY
      SELECT pt.user_id, pt.token, pt.platform
      FROM public.push_tokens pt
      WHERE pt.is_active = TRUE AND pt.user_id = v_value::UUID;
  ELSIF v_type = 'role' THEN
    RETURN QUERY
      SELECT pt.user_id, pt.token, pt.platform
      FROM public.push_tokens pt
      JOIN public.profiles p ON p.id = pt.user_id
      WHERE pt.is_active = TRUE AND p.status = 'active' AND p.role = v_value;
  ELSIF v_type = 'plan' THEN
    -- 'free' = no active subscription; otherwise active subscription with plan = v_value
    IF v_value = 'free' THEN
      RETURN QUERY
        SELECT pt.user_id, pt.token, pt.platform
        FROM public.push_tokens pt
        JOIN public.profiles p ON p.id = pt.user_id
        LEFT JOIN public.subscriptions s
          ON s.user_id = pt.user_id
         AND s.status = 'active'
         AND (s.ends_at IS NULL OR s.ends_at > NOW())
        WHERE pt.is_active = TRUE AND p.status = 'active' AND s.id IS NULL;
    ELSE
      RETURN QUERY
        SELECT pt.user_id, pt.token, pt.platform
        FROM public.push_tokens pt
        JOIN public.profiles p ON p.id = pt.user_id
        JOIN public.subscriptions s ON s.user_id = pt.user_id
        WHERE pt.is_active = TRUE
          AND p.status = 'active'
          AND s.status = 'active'
          AND s.plan = v_value
          AND (s.ends_at IS NULL OR s.ends_at > NOW());
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid audience type: %', v_type USING ERRCODE = '22023';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_resolve_push_audience(JSONB) TO authenticated;

-- 8.9 Record a notification send (called by Edge Function with service role; admins can also call to dry-run).
CREATE OR REPLACE FUNCTION public.admin_record_notification(
  p_title          TEXT,
  p_body           TEXT,
  p_link           TEXT,
  p_audience       JSONB,
  p_sent_count     INT,
  p_failed_count   INT,
  p_invalid_tokens JSONB
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_row    public.notifications;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.notifications (
    title, body, link, audience, sent_by, sent_count, failed_count, invalid_tokens
  )
  VALUES (
    p_title, p_body, p_link, p_audience, v_caller, p_sent_count, p_failed_count, p_invalid_tokens
  )
  RETURNING * INTO v_row;

  -- Mark invalid tokens as inactive
  IF p_invalid_tokens IS NOT NULL AND jsonb_typeof(p_invalid_tokens) = 'array' THEN
    UPDATE public.push_tokens
    SET is_active = FALSE, updated_at = NOW()
    WHERE token IN (SELECT jsonb_array_elements_text(p_invalid_tokens));
  END IF;

  INSERT INTO public.admin_logs (admin_id, target_user_id, action, old_value, new_value, metadata)
  VALUES (
    v_caller, NULL, 'push.send', NULL, to_jsonb(v_row), jsonb_build_object('audience', p_audience)
  );

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_record_notification(TEXT, TEXT, TEXT, JSONB, INT, INT, JSONB) TO authenticated;

-- 8.10 List admin logs (super_admin only)
CREATE OR REPLACE FUNCTION public.admin_list_logs(
  p_action  TEXT DEFAULT NULL,
  p_admin   UUID DEFAULT NULL,
  p_target  UUID DEFAULT NULL,
  p_limit   INT  DEFAULT 100,
  p_offset  INT  DEFAULT 0
)
RETURNS TABLE (
  id              UUID,
  admin_id        UUID,
  admin_email     TEXT,
  admin_name      TEXT,
  target_user_id  UUID,
  target_email    TEXT,
  target_name     TEXT,
  action          TEXT,
  old_value       JSONB,
  new_value       JSONB,
  metadata        JSONB,
  created_at      TIMESTAMPTZ,
  total_count     BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: requires super_admin' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT l.*
    FROM public.admin_logs l
    WHERE (p_action IS NULL OR l.action = p_action)
      AND (p_admin IS NULL OR l.admin_id = p_admin)
      AND (p_target IS NULL OR l.target_user_id = p_target)
  )
  SELECT
    f.id,
    f.admin_id,
    pa.email AS admin_email,
    pa.full_name AS admin_name,
    f.target_user_id,
    pt.email AS target_email,
    pt.full_name AS target_name,
    f.action,
    f.old_value,
    f.new_value,
    f.metadata,
    f.created_at,
    (SELECT COUNT(*) FROM filtered) AS total_count
  FROM filtered f
  LEFT JOIN public.profiles pa ON pa.id = f.admin_id
  LEFT JOIN public.profiles pt ON pt.id = f.target_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_logs(TEXT, UUID, UUID, INT, INT) TO authenticated;

-- 8.11 Admin dashboard summary
CREATE OR REPLACE FUNCTION public.admin_dashboard_summary()
RETURNS TABLE (
  total_users           BIGINT,
  active_users_30d      BIGINT,
  banned_users          BIGINT,
  active_subscriptions  BIGINT,
  total_revenue         NUMERIC,
  push_tokens_active    BIGINT,
  notifications_sent_30d BIGINT,
  errors_24h            BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles)::BIGINT,
    (SELECT COUNT(*) FROM public.profiles
       WHERE COALESCE(last_seen_at, last_active_at, updated_at) > NOW() - INTERVAL '30 days')::BIGINT,
    (SELECT COUNT(*) FROM public.profiles WHERE status = 'banned')::BIGINT,
    (SELECT COUNT(*) FROM public.subscriptions
       WHERE status = 'active' AND (ends_at IS NULL OR ends_at > NOW()))::BIGINT,
    COALESCE((SELECT SUM(amount) FROM public.payments WHERE status = 'completed'), 0)::NUMERIC,
    (SELECT COUNT(*) FROM public.push_tokens WHERE is_active = TRUE)::BIGINT,
    (SELECT COUNT(*) FROM public.notifications WHERE created_at > NOW() - INTERVAL '30 days')::BIGINT,
    (SELECT COUNT(*) FROM public.error_logs WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_dashboard_summary() TO authenticated;

-- -----------------------------------------------------------------------------
-- 9. Update admin_user_list view to use new columns (kept for backwards compat)
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS public.admin_user_list;
CREATE OR REPLACE VIEW public.admin_user_list
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.username,
  p.full_name,
  p.role,
  p.level,
  p.xp,
  COALESCE(p.last_seen_at, p.last_active_at) AS last_active_at,
  COALESCE(p.last_seen_at, p.last_active_at) AS last_seen_at,
  p.status,
  p.created_at,
  COALESCE(p.email, u.email) AS email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id;

-- -----------------------------------------------------------------------------
-- 10. Subscriptions: re-grant select to authenticated for views via RPC
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users can view own subscription"     ON public.subscriptions;
DROP POLICY IF EXISTS "admins can read all subscriptions"   ON public.subscriptions;

CREATE POLICY "users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "admins can read all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.is_admin());
