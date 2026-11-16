import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, ChevronDown, Mail, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/i18n/useLanguage';
import type { Subscription } from '@/types/database';

interface AccountInfoCardProps {
  subscription: Subscription | null;
}

/**
 * Compact, collapsed-by-default account details.
 *
 * The old layout rendered a full 6-row table (User ID / Email / Role /
 * Status / Plan / Joined) directly under the hero — which felt like a
 * wall of "big statistics". Now it's a single slim toggle that expands
 * on demand, so the profile opens clean and the technical details stay
 * one tap away.
 */
export const AccountInfoCard: React.FC<AccountInfoCardProps> = ({ subscription }) => {
  const { user, profile } = useAuthStore();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyId = useCallback(async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = user.id;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [user?.id]);

  const planLabel = subscription?.status === 'active'
    ? (subscription.plan === 'lifetime' ? 'Lifetime' : subscription.plan)
    : t('profile_free_plan');

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card-hover transition-colors text-left min-h-[48px]"
      >
        <ShieldCheck size={16} className="text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('profile_account_info')}</p>
          <p className="text-xs text-foreground/80 truncate flex items-center gap-1.5 mt-0.5">
            <Mail size={11} className="shrink-0 opacity-60" />
            <span className="truncate">{user?.email ?? '—'}</span>
            <span className="opacity-40">•</span>
            <span className="capitalize shrink-0">{planLabel}</span>
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border divide-y divide-border text-sm">
              <div className="px-4 py-2.5 flex items-center gap-3 min-h-[40px]">
                <span className="text-muted-foreground text-xs font-medium w-24 shrink-0">User ID</span>
                <span className="font-mono text-[11px] truncate flex-1 min-w-0">{user?.id ?? '—'}</span>
                <button
                  onClick={copyId}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-surface-2 transition-colors min-w-[30px] min-h-[30px] flex items-center justify-center"
                  title={t('profile_copy_id')}
                >
                  {copied ? <Check size={13} className="text-accent-success" /> : <Copy size={13} className="text-muted-foreground" />}
                </button>
              </div>
              <div className="px-4 py-2.5 flex items-center gap-3 min-h-[40px]">
                <span className="text-muted-foreground text-xs font-medium w-24 shrink-0">{t('profile_role')}</span>
                <span className="text-xs font-bold capitalize">{profile?.role ?? '—'}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center gap-3 min-h-[40px]">
                <span className="text-muted-foreground text-xs font-medium w-24 shrink-0">{t('profile_status')}</span>
                <span className="text-xs capitalize">{profile?.status ?? '—'}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center gap-3 min-h-[40px]">
                <span className="text-muted-foreground text-xs font-medium w-24 shrink-0">{t('profile_plan')}</span>
                <span className="text-xs font-bold capitalize">{planLabel}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center gap-3 min-h-[40px]">
                <span className="text-muted-foreground text-xs font-medium w-24 shrink-0">{t('profile_joined')}</span>
                <span className="text-xs">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
