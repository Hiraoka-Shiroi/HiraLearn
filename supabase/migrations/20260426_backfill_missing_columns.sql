-- Backfill migration for environments that already applied 20260425_init_schema.sql
-- Adds columns and policies that were missing from the original schema

-- profiles: add streak column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;

-- modules: add description column if missing
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS description TEXT;

-- tasks: add missing columns
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'code_editor';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS expected_solution TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- user_progress: add UPDATE policy if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_progress'
      AND policyname = 'Users can update own progress'
  ) THEN
    CREATE POLICY "Users can update own progress"
      ON public.user_progress FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
