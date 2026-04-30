-- ────────────────────────────────────────────────────────────────────
-- Standalone setup for the `avatars` Storage bucket + RLS policies.
--
-- If your Supabase project was deployed before migration
-- `20260430_progress_avatar_security.sql` was applied, users will see
-- "Bucket not found" when trying to upload an avatar. Run this file in
-- the SQL Editor (Supabase Dashboard → SQL) exactly ONCE. It is safe
-- to re-run (idempotent thanks to `on conflict` / `if not exists`).
--
-- What it creates:
--   • Public bucket `avatars` (5 MB max, JPG/PNG/WEBP).
--   • Read policy: anyone can fetch files from the bucket (public URLs).
--   • Write/update/delete policies scoped to `{auth.uid()}/…` prefix —
--     i.e. a user can only touch files under their own folder.
-- ────────────────────────────────────────────────────────────────────

-- 1) Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,                                                        -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Policies — drop first for clean re-apply, then recreate.
drop policy if exists "Avatars are publicly readable"         on storage.objects;
drop policy if exists "Users can upload to their avatar dir"  on storage.objects;
drop policy if exists "Users can update their own avatars"    on storage.objects;
drop policy if exists "Users can delete their own avatars"    on storage.objects;

-- Public read (so <img src="…/avatars/uid/…jpg" /> just works).
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated user can UPLOAD files under `{their-uid}/…` only.
create policy "Users can upload to their avatar dir"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can UPDATE files under `{their-uid}/…` only.
create policy "Users can update their own avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can DELETE files under `{their-uid}/…` only.
create policy "Users can delete their own avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) Sanity check — should return one row.
-- select id, name, public, file_size_limit, allowed_mime_types
-- from storage.buckets where id = 'avatars';
