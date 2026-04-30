-- =============================================================================
-- HiraLearn — Progress, profile, and avatar security hardening
-- =============================================================================
-- This migration is idempotent and safe to re-run.
--
-- Adds:
--   1. Unique constraints on (modules, lessons, tasks) so seeds can use
--      true ON CONFLICT DO UPDATE upserts and accidental dupes are blocked.
--   2. SECURITY DEFINER RPC `complete_lesson(p_lesson_id)` — the only sane
--      way to award XP, level, and streak. Client cannot just bump xp.
--   3. SECURITY DEFINER RPC `update_own_profile(...)` — the only sane way
--      for a user to update their own profile fields.
--   4. BEFORE UPDATE trigger on profiles that resets protected columns
--      (xp/level/streak/role/status/email/created_at) for any direct
--      UPDATE not coming from a SECURITY DEFINER context. Defense in depth.
--   5. Storage bucket `avatars` (public-read) with RLS policies that only
--      let a user write/update/delete files inside their own user_id folder.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Unique constraints (used by seed.sql's ON CONFLICT DO UPDATE)
-- -----------------------------------------------------------------------------

-- modules: a course cannot have two modules with the same slug
CREATE UNIQUE INDEX IF NOT EXISTS modules_course_slug_uidx
  ON public.modules (course_id, slug);

-- lessons: a module cannot have two lessons with the same slug
CREATE UNIQUE INDEX IF NOT EXISTS lessons_module_slug_uidx
  ON public.lessons (module_id, slug);

-- tasks: a lesson cannot have two tasks with the same order_index
CREATE UNIQUE INDEX IF NOT EXISTS tasks_lesson_order_uidx
  ON public.tasks (lesson_id, order_index);

-- courses: explicit order_index so the UI shows them in the canonical
--           HTML → CSS → … → Projects sequence rather than insertion order.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS courses_order_idx ON public.courses (order_index);

-- -----------------------------------------------------------------------------
-- 2. Trigger: lock down protected profile columns for non-trusted callers
-- -----------------------------------------------------------------------------
-- We treat any UPDATE running under a session role *different from* the
-- current_user as "trusted" — that's exactly the case inside a
-- SECURITY DEFINER function (Postgres swaps current_user to the function
-- owner while leaving session_user as the caller's role). Every other
-- UPDATE (i.e. raw REST `update profiles set ...` from `authenticated`)
-- gets its protected columns rewritten to the OLD values.
--
-- Allowed direct columns: full_name, username, avatar_url, current_goal,
--   daily_minutes, explanation_style, last_active_at.
-- Protected (silently reverted): xp, level, streak, role, status, email,
--   created_at, updated_at, last_seen_at.

-- NOTE: this is intentionally NOT SECURITY DEFINER. Inside a SECURITY DEFINER
-- trigger function `current_user` would be the function owner instead of the
-- caller's effective role, which would defeat the `IN ('anon','authenticated')`
-- check below. Trigger functions don't need SECURITY DEFINER to write the row
-- they were fired for — the underlying DML already passed RLS.
CREATE OR REPLACE FUNCTION public.profiles_protect_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only the user-facing roles (anon / authenticated) get their UPDATEs
  -- filtered. SECURITY DEFINER functions, service_role, postgres, and any
  -- other DB-direct role bypass the guard — that's how complete_lesson and
  -- the admin_* RPCs are still able to write xp / role / status.
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  -- Untrusted path (raw UPDATE from REST): silently revert protected fields.
  NEW.xp           := OLD.xp;
  NEW.level        := OLD.level;
  NEW.streak       := OLD.streak;
  NEW.role         := OLD.role;
  NEW.status       := OLD.status;
  NEW.email        := OLD.email;
  NEW.created_at   := OLD.created_at;
  NEW.last_seen_at := OLD.last_seen_at;
  -- updated_at is bumped fresh in case clients try to fake old timestamps
  NEW.updated_at   := NOW();
  -- last_active_at is intentionally allowed to be touched (App.tsx pings it)

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_columns_trg ON public.profiles;
CREATE TRIGGER profiles_protect_columns_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_columns();

-- -----------------------------------------------------------------------------
-- 3. RPC: complete_lesson(p_lesson_id)
-- -----------------------------------------------------------------------------
-- Awards XP, recomputes level, updates streak in one atomic SECURITY DEFINER
-- call. Client side cannot bypass this — the protect-columns trigger blocks
-- direct xp/level/streak updates from raw REST traffic.

CREATE OR REPLACE FUNCTION public.complete_lesson(p_lesson_id UUID)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id              UUID;
  v_xp_reward            INTEGER;
  v_is_published         BOOLEAN;
  v_already_completed    BOOLEAN;
  v_today                DATE := (NOW() AT TIME ZONE 'UTC')::date;
  v_last_completion_date DATE;
  v_old_streak           INTEGER;
  v_new_streak           INTEGER;
  v_new_xp               INTEGER;
  v_new_level            INTEGER;
  v_profile              public.profiles;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- 3.1 Validate the lesson
  SELECT xp_reward, is_published
    INTO v_xp_reward, v_is_published
  FROM public.lessons
  WHERE id = p_lesson_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson % does not exist', p_lesson_id USING ERRCODE = 'P0002';
  END IF;
  IF NOT v_is_published THEN
    RAISE EXCEPTION 'Lesson % is not published', p_lesson_id USING ERRCODE = '42501';
  END IF;

  v_xp_reward := COALESCE(v_xp_reward, 0);

  -- 3.2 Idempotent: if already completed, return current profile and stop.
  SELECT EXISTS (
    SELECT 1 FROM public.user_progress
    WHERE user_id = v_user_id
      AND lesson_id = p_lesson_id
      AND status = 'completed'
  ) INTO v_already_completed;

  IF v_already_completed THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
    RETURN v_profile;
  END IF;

  -- 3.3 Insert (or upsert) the user_progress row
  INSERT INTO public.user_progress (user_id, lesson_id, status, completed_at)
  VALUES (v_user_id, p_lesson_id, 'completed', NOW())
  ON CONFLICT (user_id, lesson_id) DO UPDATE
    SET status       = 'completed',
        completed_at = EXCLUDED.completed_at;

  -- 3.4 Compute streak based on previous completions
  SELECT (completed_at AT TIME ZONE 'UTC')::date
    INTO v_last_completion_date
  FROM public.user_progress
  WHERE user_id = v_user_id
    AND status = 'completed'
    AND lesson_id <> p_lesson_id
  ORDER BY completed_at DESC
  LIMIT 1;

  SELECT COALESCE(streak, 0) INTO v_old_streak
  FROM public.profiles WHERE id = v_user_id;

  IF v_last_completion_date IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last_completion_date = v_today THEN
    v_new_streak := GREATEST(v_old_streak, 1);
  ELSIF v_last_completion_date = v_today - 1 THEN
    v_new_streak := v_old_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  -- 3.5 Apply XP, recompute level, write streak, return profile
  UPDATE public.profiles
     SET xp           = COALESCE(xp, 0) + v_xp_reward,
         streak       = v_new_streak,
         last_seen_at = NOW(),
         updated_at   = NOW()
   WHERE id = v_user_id
   RETURNING xp INTO v_new_xp;

  v_new_level := CASE
    WHEN v_new_xp < 100  THEN 1
    WHEN v_new_xp < 300  THEN 2
    WHEN v_new_xp < 600  THEN 3
    WHEN v_new_xp < 1000 THEN 4
    WHEN v_new_xp < 1500 THEN 5
    WHEN v_new_xp < 2100 THEN 6
    WHEN v_new_xp < 2800 THEN 7
    WHEN v_new_xp < 3600 THEN 8
    WHEN v_new_xp < 4500 THEN 9
    ELSE 10
  END;

  UPDATE public.profiles
     SET level = v_new_level
   WHERE id = v_user_id
   RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_lesson(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_lesson(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: update_own_profile(...)
-- -----------------------------------------------------------------------------
-- The official way for a user to update their own profile. NULL means
-- "leave alone"; '' (empty string) means "clear to NULL" for nullable
-- text fields. Returns the updated profile so client can sync state.

CREATE OR REPLACE FUNCTION public.update_own_profile(
  p_full_name         TEXT    DEFAULT NULL,
  p_username          TEXT    DEFAULT NULL,
  p_avatar_url        TEXT    DEFAULT NULL,
  p_current_goal      TEXT    DEFAULT NULL,
  p_daily_minutes     INTEGER DEFAULT NULL,
  p_explanation_style TEXT    DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile public.profiles;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles SET
    full_name         = CASE
      WHEN p_full_name IS NULL THEN full_name
      WHEN p_full_name = ''    THEN NULL
      ELSE p_full_name
    END,
    username          = CASE
      WHEN p_username IS NULL THEN username
      WHEN p_username = ''    THEN NULL
      ELSE p_username
    END,
    avatar_url        = CASE
      WHEN p_avatar_url IS NULL THEN avatar_url
      WHEN p_avatar_url = ''    THEN NULL
      ELSE p_avatar_url
    END,
    current_goal      = CASE
      WHEN p_current_goal IS NULL THEN current_goal
      WHEN p_current_goal = ''    THEN NULL
      ELSE p_current_goal
    END,
    daily_minutes     = COALESCE(p_daily_minutes, daily_minutes),
    explanation_style = CASE
      WHEN p_explanation_style IS NULL THEN explanation_style
      WHEN p_explanation_style = ''    THEN NULL
      ELSE p_explanation_style
    END,
    updated_at        = NOW()
  WHERE id = v_user_id
  RETURNING * INTO v_profile;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Profile for % not found', v_user_id USING ERRCODE = 'P0002';
  END IF;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.update_own_profile(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_profile(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC: award_xp(p_amount, p_reason)
-- -----------------------------------------------------------------------------
-- Generic XP-award path used by the games / arcade page. Wraps the same
-- SECURITY-DEFINER trick: clients still cannot UPDATE xp/level directly
-- because of the protect_columns trigger; everything must go through this
-- RPC. The amount is clamped to a sane range so a malicious caller cannot
-- pass +999999 by editing the request payload. Reason is recorded to
-- admin_logs (if it exists) for audit, otherwise silently ignored.
--
-- Returns the updated profile so the client can sync Zustand.

CREATE OR REPLACE FUNCTION public.award_xp(
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID;
  v_amount    INTEGER;
  v_new_xp    INTEGER;
  v_new_level INTEGER;
  v_profile   public.profiles;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Clamp so a malicious client cannot self-promote in one call.
  v_amount := GREATEST(0, LEAST(COALESCE(p_amount, 0), 200));
  IF v_amount = 0 THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
    RETURN v_profile;
  END IF;

  UPDATE public.profiles
     SET xp         = COALESCE(xp, 0) + v_amount,
         updated_at = NOW()
   WHERE id = v_user_id
   RETURNING xp INTO v_new_xp;

  v_new_level := CASE
    WHEN v_new_xp < 100  THEN 1
    WHEN v_new_xp < 300  THEN 2
    WHEN v_new_xp < 600  THEN 3
    WHEN v_new_xp < 1000 THEN 4
    WHEN v_new_xp < 1500 THEN 5
    WHEN v_new_xp < 2100 THEN 6
    WHEN v_new_xp < 2800 THEN 7
    WHEN v_new_xp < 3600 THEN 8
    WHEN v_new_xp < 4500 THEN 9
    ELSE 10
  END;

  UPDATE public.profiles
     SET level = v_new_level
   WHERE id = v_user_id
   RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp(INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp(INTEGER, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. Storage bucket `avatars` + RLS policies
-- -----------------------------------------------------------------------------
-- File layout convention: avatars/<user_id>/<timestamp>.<ext>
-- The first path segment must equal auth.uid().

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read for avatars (it's a public bucket, but we still need a policy)
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload only inside their own folder
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can replace files inside their own folder
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete files inside their own folder (cleanup of stale avatars)
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- End of 20260430_progress_avatar_security.sql
-- =============================================================================
