import { supabase } from '@/lib/supabase/client';
import { profileService } from '@/lib/supabase/services';
import type { Profile } from '@/types/database';

export interface UploadAvatarInput {
  userId: string;
  blob: Blob;
  /** Existing avatar_url (used to delete the old object after upload). */
  previousAvatarUrl?: string | null;
}

/**
 * Upload a 512×512 JPEG to the `avatars` Supabase Storage bucket and
 * persist the new public URL on the user's profile via
 * `update_own_profile`. Returns the refreshed profile.
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
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(objectName);

  const publicUrl = publicUrlData.publicUrl;
  if (!publicUrl) throw new Error('avatar-public-url-missing');

  const profile = await profileService.updateOwnProfile({ avatar_url: publicUrl });

  // Best-effort: drop the previous file if it lived in our own bucket.
  if (previousAvatarUrl && previousAvatarUrl.includes('/avatars/')) {
    const prefix = '/avatars/';
    const idx = previousAvatarUrl.indexOf(prefix);
    if (idx !== -1) {
      const oldPath = previousAvatarUrl.slice(idx + prefix.length).split('?')[0];
      if (oldPath && oldPath.startsWith(`${userId}/`)) {
        // Ignore errors — RLS or 404 shouldn't break the new upload.
        await supabase.storage.from('avatars').remove([oldPath]).catch(() => {});
      }
    }
  }

  return profile;
}
