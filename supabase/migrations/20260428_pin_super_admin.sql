-- 20260428_pin_super_admin.sql
--
-- Гарантирует, что у владельца аккаунта shiroihiraoka@gmail.com всегда роль
-- super_admin и активный статус. Никакой админ или скрипт не сможет понизить
-- эту учётку — триггер откатывает любую попытку UPDATE/INSERT, которая делает
-- роль ниже super_admin или статус не active.
--
-- Идея:
--   1. Identify «закреплённых» пользователей по email в auth.users
--      (через таблицу public.pinned_super_admins, чтобы было легко расширять).
--   2. Триггер BEFORE INSERT/UPDATE на profiles форсит role='super_admin' и
--      status='active' для этих UID.
--   3. Применяем сейчас же на всех существующих профилях.
--
-- Эту миграцию безопасно прогонять повторно.

-- 1. Список «закреплённых» учёток (по email).
CREATE TABLE IF NOT EXISTS public.pinned_super_admins (
  email TEXT PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pinned_super_admins ENABLE ROW LEVEL SECURITY;

-- Видна только super_admin'ам (RPC + RLS).
DROP POLICY IF EXISTS "super_admin reads pinned" ON public.pinned_super_admins;
CREATE POLICY "super_admin reads pinned"
  ON public.pinned_super_admins FOR SELECT
  USING (public.is_super_admin());

INSERT INTO public.pinned_super_admins (email, reason)
VALUES ('shiroihiraoka@gmail.com', 'Owner — locked super_admin')
ON CONFLICT (email) DO NOTHING;

-- 2. Helper: возвращает TRUE, если для данного user.id email закреплён.
CREATE OR REPLACE FUNCTION public.is_pinned_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.pinned_super_admins p ON LOWER(p.email) = LOWER(u.email)
    WHERE u.id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_pinned_super_admin(UUID) TO authenticated, service_role;

-- 3. Триггер: для закреплённых учёток роль и статус всегда форсятся.
CREATE OR REPLACE FUNCTION public.enforce_pinned_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF public.is_pinned_super_admin(NEW.id) THEN
    NEW.role := 'super_admin';
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_pinned_super_admin ON public.profiles;
CREATE TRIGGER trg_enforce_pinned_super_admin
BEFORE INSERT OR UPDATE OF role, status ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_pinned_super_admin();

-- 4. Прогоняем существующие профили, чтобы поправить state.
UPDATE public.profiles p
   SET role = 'super_admin',
       status = 'active'
  FROM auth.users u
  JOIN public.pinned_super_admins pa ON LOWER(pa.email) = LOWER(u.email)
 WHERE p.id = u.id;

-- 5. Если у пользователя ещё нет profile-row (теоретически возможно), создаём.
INSERT INTO public.profiles (id, role, status, email, current_goal, daily_minutes, explanation_style)
SELECT
  u.id,
  'super_admin',
  'active',
  u.email,
  COALESCE((u.raw_user_meta_data->>'current_goal'), 'general'),
  COALESCE((u.raw_user_meta_data->>'daily_minutes')::INT, 15),
  COALESCE((u.raw_user_meta_data->>'explanation_style'), 'simple')
FROM auth.users u
JOIN public.pinned_super_admins pa ON LOWER(pa.email) = LOWER(u.email)
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Защита: и admin_set_user_role, и admin_set_user_status явно блокируют
-- закреплённые учётки. Триггер выше — резервная защита, но мы возвращаем
-- понятную ошибку клиенту.
--
-- DROP перед CREATE: в 20260427 эти функции созданы с RETURNS VOID, и
-- PostgreSQL не позволяет менять возвращаемый тип через CREATE OR REPLACE.
DROP FUNCTION IF EXISTS public.admin_set_user_role(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user UUID,
  p_new_role    TEXT,
  p_reason      TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_role TEXT;
  v_target_old  public.profiles%ROWTYPE;
  v_updated     public.profiles%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin or super_admin required';
  END IF;

  IF p_new_role NOT IN ('user','moderator','admin','super_admin') THEN
    RAISE EXCEPTION 'invalid role: %', p_new_role;
  END IF;

  SELECT * INTO v_target_old FROM public.profiles WHERE id = p_target_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  IF p_target_user = auth.uid() THEN
    RAISE EXCEPTION 'cannot change own role';
  END IF;

  IF public.is_pinned_super_admin(p_target_user) THEN
    RAISE EXCEPTION 'this account is locked as super_admin and cannot be changed';
  END IF;

  SELECT role::TEXT INTO v_caller_role FROM public.profiles WHERE id = auth.uid();

  IF p_new_role IN ('admin','super_admin') AND v_caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'only super_admin can assign admin/super_admin';
  END IF;

  IF v_target_old.role = 'super_admin' AND v_caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'cannot modify super_admin';
  END IF;

  IF public.role_rank(p_new_role) > public.role_rank(v_caller_role) THEN
    RAISE EXCEPTION 'cannot grant role higher than your own';
  END IF;

  UPDATE public.profiles
     SET role = p_new_role,
         updated_at = NOW()
   WHERE id = p_target_user
   RETURNING * INTO v_updated;

  INSERT INTO public.admin_logs(admin_id, target_user_id, action, old_value, new_value, metadata)
  VALUES (
    auth.uid(), p_target_user, 'role.change',
    jsonb_build_object('role', v_target_old.role),
    jsonb_build_object('role', p_new_role),
    jsonb_build_object('reason', p_reason)
  );

  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_set_user_status(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.admin_set_user_status(
  p_target_user UUID,
  p_new_status  TEXT,
  p_reason      TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_target_old public.profiles%ROWTYPE;
  v_updated    public.profiles%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin or super_admin required';
  END IF;

  IF p_new_status NOT IN ('active','banned','deleted') THEN
    RAISE EXCEPTION 'invalid status: %', p_new_status;
  END IF;

  SELECT * INTO v_target_old FROM public.profiles WHERE id = p_target_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  IF p_target_user = auth.uid() THEN
    RAISE EXCEPTION 'cannot change own status';
  END IF;

  IF public.is_pinned_super_admin(p_target_user) THEN
    RAISE EXCEPTION 'this account is locked and cannot be banned';
  END IF;

  IF v_target_old.role = 'super_admin' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'cannot modify super_admin';
  END IF;

  UPDATE public.profiles
     SET status = p_new_status,
         updated_at = NOW()
   WHERE id = p_target_user
   RETURNING * INTO v_updated;

  INSERT INTO public.admin_logs(admin_id, target_user_id, action, old_value, new_value, metadata)
  VALUES (
    auth.uid(), p_target_user, 'status.change',
    jsonb_build_object('status', v_target_old.status),
    jsonb_build_object('status', p_new_status),
    jsonb_build_object('reason', p_reason)
  );

  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_status(UUID, TEXT, TEXT) TO authenticated;
