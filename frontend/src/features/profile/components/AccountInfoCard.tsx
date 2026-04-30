import React, { useState, useCallback } from 'react';
import { Check, Copy, Info } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/i18n/useLanguage';
import type { Subscription } from '@/types/database';

interface AccountInfoCardProps {
  subscription: Subscription | null;
}

export const AccountInfoCard: React.FC<AccountInfoCardProps> = ({ subscription }) => {
  const { user, profile } = useAuthStore();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copyId = useCallback(async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = user.id;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [user?.id]);

  return (
    <section>
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <Info size={18} className="text-muted-foreground" /> {t('profile_account_info')}
      </h2>
      <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden text-sm">
        <div className="p-3.5 flex items-center gap-3 min-h-[48px]">
          <span className="text-muted-foreground text-xs font-medium w-20 shrink-0">User ID</span>
          <span className="font-mono text-xs truncate flex-1 min-w-0">{user?.id ?? '—'}</span>
          <button onClick={copyId} className="shrink-0 p-1.5 rounded-lg hover:bg-surface-2 active:bg-surface-2 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center" title={t('profile_copy_id')}>
            {copied ? <Check size={14} className="text-accent-success" /> : <Copy size={14} className="text-muted-foreground" />}
          </button>
        </div>
        <div className="p-3.5 flex items-center gap-3 min-h-[48px]">
          <span className="text-muted-foreground text-xs font-medium w-20 shrink-0">Email</span>
          <span className="text-xs truncate">{user?.email ?? '—'}</span>
        </div>
        <div className="p-3.5 flex items-center gap-3 min-h-[48px]">
          <span className="text-muted-foreground text-xs font-medium w-20 shrink-0">{t('profile_role')}</span>
          <span className="text-xs font-bold capitalize">{profile?.role ?? '—'}</span>
        </div>
        <div className="p-3.5 flex items-center gap-3 min-h-[48px]">
          <span className="text-muted-foreground text-xs font-medium w-20 shrink-0">{t('profile_status')}</span>
          <span className="text-xs capitalize">{profile?.status ?? '—'}</span>
        </div>
        <div className="p-3.5 flex items-center gap-3 min-h-[48px]">
          <span className="text-muted-foreground text-xs font-medium w-20 shrink-0">{t('profile_plan')}</span>
          <span className="text-xs font-bold capitalize">{subscription?.plan ?? 'free'}</span>
        </div>
        <div className="p-3.5 flex items-center gap-3 min-h-[48px]">
          <span className="text-muted-foreground text-xs font-medium w-20 shrink-0">{t('profile_joined')}</span>
          <span className="text-xs">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</span>
        </div>
      </div>
    </section>
  );
};
