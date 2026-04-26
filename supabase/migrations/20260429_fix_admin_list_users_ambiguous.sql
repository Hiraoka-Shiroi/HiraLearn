-- =============================================================================
-- 20260429_fix_admin_list_users_ambiguous.sql
-- =============================================================================
-- Bug: admin_list_users() crashes with
--      "column reference 'email' is ambiguous"
-- when called from the admin Users page. The function declares OUT parameters
-- (email, role, status, plan, plan_active, ...) via RETURNS TABLE; inside the
-- function body, unqualified references to the same names in WHERE/ORDER BY
-- clauses collide with those OUT parameters.
--
-- Fix: qualify every column reference with its CTE alias inside the function
-- body. Functionally identical, just unambiguous to the planner.
-- =============================================================================

DROP FUNCTION IF EXISTS public.admin_list_users(
  TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, INT, INT
);

CREATE FUNCTION public.admin_list_users(
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
      p.id           AS b_id,
      COALESCE(p.email, u.email) AS b_email,
      p.full_name    AS b_full_name,
      p.username     AS b_username,
      p.role         AS b_role,
      p.status       AS b_status,
      p.level        AS b_level,
      p.xp           AS b_xp,
      p.created_at   AS b_created_at,
      COALESCE(p.last_seen_at, p.last_active_at, p.updated_at) AS b_last_seen_at,
      s.plan         AS b_plan,
      CASE
        WHEN s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())
          THEN TRUE
        ELSE FALSE
      END           AS b_plan_active,
      s.ends_at     AS b_plan_ends_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.subscriptions s ON s.user_id = p.id
  ),
  filtered AS (
    SELECT b.*
    FROM base b
    WHERE (v_search IS NULL
           OR LOWER(COALESCE(b.b_email,'')) LIKE '%' || v_search || '%'
           OR LOWER(COALESCE(b.b_full_name,'')) LIKE '%' || v_search || '%'
           OR LOWER(COALESCE(b.b_username,'')) LIKE '%' || v_search || '%')
      AND (p_role   IS NULL OR b.b_role   = p_role)
      AND (p_status IS NULL OR b.b_status = p_status)
      AND (p_plan   IS NULL OR b.b_plan   = p_plan)
      AND (p_only_active_sub IS NULL OR b.b_plan_active = p_only_active_sub)
  )
  SELECT
    f.b_id, f.b_email, f.b_full_name, f.b_username, f.b_role, f.b_status,
    f.b_level, f.b_xp, f.b_created_at, f.b_last_seen_at,
    f.b_plan, f.b_plan_active, f.b_plan_ends_at,
    (SELECT COUNT(*) FROM filtered) AS total_count
  FROM filtered f
  ORDER BY
    CASE WHEN p_sort = 'created_desc'   THEN f.b_created_at   END DESC NULLS LAST,
    CASE WHEN p_sort = 'created_asc'    THEN f.b_created_at   END ASC  NULLS LAST,
    CASE WHEN p_sort = 'last_seen_desc' THEN f.b_last_seen_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'last_seen_asc'  THEN f.b_last_seen_at END ASC  NULLS LAST,
    CASE WHEN p_sort = 'email_asc'      THEN f.b_email        END ASC  NULLS LAST,
    CASE WHEN p_sort = 'email_desc'     THEN f.b_email        END DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users(
  TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, INT, INT
) TO authenticated;
