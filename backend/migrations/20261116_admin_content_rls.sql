-- =============================================================================
-- HiraLearn — разблокировка создания/редактирования контента в админке (#1)
-- =============================================================================
-- Проблема: на таблицах courses / modules / lessons / tasks включён RLS,
-- но есть только SELECT-политики (опубликованное видят все). Политик
-- INSERT / UPDATE / DELETE для админов НЕТ — поэтому кнопка «Создать урок»
-- в админке молча падала с RLS-ошибкой, а черновики (is_published=false)
-- не были видны даже админам в списке.
--
-- Решение: добавляем администраторам (role >= admin, через существующий
-- SECURITY DEFINER-хелпер public.is_admin()) полный доступ к контентным
-- таблицам. Идемпотентно — можно запускать повторно.
--
-- Запуск: Supabase Dashboard → SQL Editor → вставить → Run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. courses
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all courses"      ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses"        ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses"        ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses"        ON public.courses;

CREATE POLICY "Admins can view all courses" ON public.courses
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert courses" ON public.courses
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update courses" ON public.courses
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete courses" ON public.courses
  FOR DELETE USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. modules
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all modules"      ON public.modules;
DROP POLICY IF EXISTS "Admins can insert modules"        ON public.modules;
DROP POLICY IF EXISTS "Admins can update modules"        ON public.modules;
DROP POLICY IF EXISTS "Admins can delete modules"        ON public.modules;

CREATE POLICY "Admins can view all modules" ON public.modules
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert modules" ON public.modules
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update modules" ON public.modules
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete modules" ON public.modules
  FOR DELETE USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. lessons
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all lessons"      ON public.lessons;
DROP POLICY IF EXISTS "Admins can insert lessons"        ON public.lessons;
DROP POLICY IF EXISTS "Admins can update lessons"        ON public.lessons;
DROP POLICY IF EXISTS "Admins can delete lessons"        ON public.lessons;

CREATE POLICY "Admins can view all lessons" ON public.lessons
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert lessons" ON public.lessons
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update lessons" ON public.lessons
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete lessons" ON public.lessons
  FOR DELETE USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. tasks
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all tasks"        ON public.tasks;
DROP POLICY IF EXISTS "Admins can insert tasks"          ON public.tasks;
DROP POLICY IF EXISTS "Admins can update tasks"          ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks"          ON public.tasks;

CREATE POLICY "Admins can view all tasks" ON public.tasks
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert tasks" ON public.tasks
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update tasks" ON public.tasks
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete tasks" ON public.tasks
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- Проверка: должно вернуть 16 политик (4 таблицы × 4 действия)
--   SELECT tablename, policyname FROM pg_policies
--   WHERE schemaname = 'public' AND policyname LIKE 'Admins %'
--   ORDER BY tablename, policyname;
-- =============================================================================
