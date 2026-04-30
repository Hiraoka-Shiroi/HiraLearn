import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { profileService } from '@/lib/supabase/services';
import { useLanguage } from '@/i18n/useLanguage';
import { Avatar } from '@/components/avatar/Avatar';
import { AvatarPickerModal } from '@/components/avatar/AvatarPickerModal';
import { uploadAvatar } from '@/lib/avatar/uploadAvatar';

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

const EditField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent-primary min-h-[44px]"
    />
  </div>
);

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ open, onClose }) => {
  const { user, profile, setProfile } = useAuthStore();
  const { t } = useLanguage();

  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    avatar_url: profile?.avatar_url || '',
    current_goal: profile?.current_goal || '',
    daily_minutes: profile?.daily_minutes ?? 30,
    explanation_style: profile?.explanation_style || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setEditForm({
        full_name: profile?.full_name || '',
        username: profile?.username || '',
        avatar_url: profile?.avatar_url || '',
        current_goal: profile?.current_goal || '',
        daily_minutes: profile?.daily_minutes ?? 30,
        explanation_style: profile?.explanation_style || '',
      });
      setError('');
    }
  }, [open, profile]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const next = await profileService.updateOwnProfile({
        full_name:         editForm.full_name || null,
        username:          editForm.username || null,
        avatar_url:        editForm.avatar_url || null,
        current_goal:      editForm.current_goal ?? '',
        daily_minutes:     editForm.daily_minutes,
        explanation_style: editForm.explanation_style ?? '',
      });
      setProfile(next);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [user, editForm, setProfile, onClose]);

  const handleAvatarUpload = useCallback(async (blob: Blob) => {
    if (!user) return;
    const next = await uploadAvatar({
      userId: user.id,
      blob,
      previousAvatarUrl: profile?.avatar_url ?? editForm.avatar_url ?? null,
    });
    setProfile(next);
    setEditForm(f => ({ ...f, avatar_url: next.avatar_url ?? '' }));
  }, [user, profile?.avatar_url, editForm.avatar_url, setProfile]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-5 flex items-center justify-between z-10 rounded-t-3xl sm:rounded-t-2xl">
                <h2 className="text-lg font-bold">{t('profile_edit')}</h2>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar src={editForm.avatar_url} name={editForm.full_name} sizeClass="w-16 h-16" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {t('avatar_change')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setAvatarPickerOpen(true)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-surface-2 active:bg-surface-2 transition-colors min-h-[44px] flex items-center justify-center gap-2"
                    >
                      {t('avatar_modal_pick_btn')}
                    </button>
                  </div>
                </div>

                <EditField label={t('profile_field_name')} value={editForm.full_name} onChange={v => setEditForm(f => ({ ...f, full_name: v }))} />
                <EditField label={t('profile_field_username')} value={editForm.username} onChange={v => setEditForm(f => ({ ...f, username: v }))} placeholder="@username" />
                <EditField label={t('profile_goal_label')} value={editForm.current_goal} onChange={v => setEditForm(f => ({ ...f, current_goal: v }))} />

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('profile_daily_label')}</label>
                  <select
                    value={editForm.daily_minutes}
                    onChange={(e) => setEditForm(f => ({ ...f, daily_minutes: Number(e.target.value) }))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent-primary min-h-[44px]"
                  >
                    <option value={15}>15 {t('profile_minutes_short')}</option>
                    <option value={30}>30 {t('profile_minutes_short')}</option>
                    <option value={60}>60 {t('profile_minutes_short')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('profile_style_label')}</label>
                  <select
                    value={editForm.explanation_style}
                    onChange={(e) => setEditForm(f => ({ ...f, explanation_style: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent-primary min-h-[44px]"
                  >
                    <option value="">{t('profile_style_default')}</option>
                    <option value="concise">{t('onboarding_style_concise')}</option>
                    <option value="detailed">{t('onboarding_style_detailed')}</option>
                    <option value="visual">{t('onboarding_style_visual')}</option>
                  </select>
                </div>

                {error && (
                  <p className="text-accent-danger text-sm bg-accent-danger/10 rounded-lg p-3">{error}</p>
                )}
              </div>

              <div className="sticky bottom-0 bg-card border-t border-border p-4 sm:p-5 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-border font-bold text-sm hover:bg-surface-2 active:bg-surface-2 transition-colors min-h-[48px]"
                >
                  {t('common_cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-accent-primary text-white font-bold text-sm hover:opacity-90 active:opacity-90 transition-all disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                  {t('common_save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AvatarPickerModal
        open={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        onCropped={handleAvatarUpload}
        title={profile?.full_name ?? profile?.username ?? undefined}
      />
    </>
  );
};
