import { supabase } from '@/lib/supabase/client';
import { profileService } from '@/lib/supabase/services';
import type { Profile } from '@/types/database';
import type { TranslationKey } from '@/i18n/translations';

export interface UploadAvatarInput {
  userId: string;
  blob: Blob;
  /** Existing avatar_url (used to delete the old object after upload). */
  previousAvatarUrl?: string | null;
}

/**
 * A typed error the UI can translate without inspecting raw Supabase
 * error messages. `codeKey` is always a valid `TranslationKey` so the
 * avatar picker modal can just pass it through `t()`.
 */
export class AvatarUploadError extends Error {
  /** Valid TranslationKey so the UI can `t(codeKey)` directly. */
  readonly codeKey: TranslationKey;
  /** Developer-facing context (kept in English). */
  readonly detail?: string;

  constructor(codeKey: TranslationKey, detail?: string) {
    super(detail ?? codeKey);
    this.codeKey = codeKey;
    this.detail = detail;
  }
}

/**
 * Map a Supabase/Network error to a human-friendly AvatarUploadError.
 *
 * We look at both the error message and HTTP status because Supabase's
 * storage errors can come from the JS client (`StorageError`), from
 * `fetch` (network), or from the PostgREST profile update (RLS).
 */
function mapUploadError(e: unknown): AvatarUploadError {
  const msg = (e instanceof Error ? e.message : String(e ?? '')).toLowerCase();

  const record = (e ?? {}) as Record<string, unknown>;
  const rawStatus = record.statusCode ?? record.status;
  const status = typeof rawStatus === 'string' ? parseInt(rawStatus, 10) : (typeof rawStatus === 'number' ? rawStatus : undefined);

  if (msg.includes('bucket not found') || msg.includes('no such bucket') || status === 404) {
    return new AvatarUploadError('avatar_err_bucket_missing', 'Supabase storage bucket `avatars` missing');
  }
  if (msg.includes('row-level security') || msg.includes('row level security') || msg.includes('rls') ||
      msg.includes('not authorized') || status === 401 || status === 403) {
    return new AvatarUploadError('avatar_err_rls', 'RLS policy rejected avatar upload');
  }
  if (msg.includes('mime') || msg.includes('content type') || msg.includes('invalid file')) {
    return new AvatarUploadError('avatar_err_mime', 'Invalid MIME type');
  }
  if (msg.includes('too large') || msg.includes('exceeded') || msg.includes('payload') || status === 413) {
    return new AvatarUploadError('avatar_err_size', 'File exceeds size limit');
  }
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('load failed')) {
    return new AvatarUploadError('avatar_err_network', 'Network failure');
  }
  return new AvatarUploadError('avatar_err_generic', msg || 'Unknown upload error');
}

/**
 * Upload a 512×512 JPEG to the `avatars` Supabase Storage bucket and
 * persist the new public URL on the user's profile via
 * `update_own_profile`. Returns the refreshed profile.
 *
 * Throws `AvatarUploadError` with a translatable `codeKey`.
 */
export async function uploadAvatar({
  userId, blob, previousAvatarUrl,
}: UploadAvatarInput): Promise<Profile> {
  const objectName = `${userId}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(objectName, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadError) throw mapUploadError(uploadError);

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(objectName);

  const publicUrl = publicUrlData.publicUrl;
  if (!publicUrl) throw new AvatarUploadError('avatar_err_generic', 'Public URL missing');

  let profile: Profile;
  try {
    profile = await profileService.updateOwnProfile({ avatar_url: publicUrl });
  } catch (e) {
    // The file is in storage but the profile DB update failed (likely
    // RLS on `profiles` or the update_own_profile RPC). Surface a
    // clear error rather than silently keeping a dangling blob.
    throw mapUploadError(e);
  }

  // Best-effort: drop the previous file if it lived in our own bucket.
  if (previousAvatarUrl && previousAvatarUrl.includes('/avatars/')) {
    const prefix = '/avatars/';
    const idx = previousAvatarUrl.indexOf(prefix);
    if (idx !== -1) {
      const oldPath = previousAvatarUrl.slice(idx + prefix.length).split('?')[0];
      if (oldPath && oldPath.startsWith(`${userId}/`)) {
        await supabase.storage.from('avatars').remove([oldPath]).catch(() => {});
      }
    }
  }

  return profile;
}
