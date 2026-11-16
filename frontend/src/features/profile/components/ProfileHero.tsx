import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Camera } from 'lucide-react';
import { Avatar } from '@/components/avatar/Avatar';
import { AvatarPickerModal } from '@/components/avatar/AvatarPickerModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/i18n/useLanguage';
import { uploadAvatar } from '@/lib/avatar/uploadAvatar';
import type { Subscription } from '@/types/database';

interface ProfileHeroProps {
  level: number;
  xp: number;
  xpInLevel: number;
  xpNeeded: number;
  xpPercent: number;
  subscription: Subscription | null;
  daysSinceJoin: number;
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  level, xp, xpInLevel, xpNeeded, xpPercent, subscription, daysSinceJoin,
}) => {
  const { user, profile, setProfile } = useAuthStore();
  const { t } = useLanguage();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleAvatarCropped = async (blob: Blob) => {
    if (!user) return;
    const next = await uploadAvatar({
      userId: user.id,
      blob,
      previousAvatarUrl: profile?.avatar_url ?? null,
    });
    // `setProfile` is reactively consumed by <Avatar> in sidebar, dashboard
    // and this hero — so the new URL pops everywhere without a reload.
    setProfile(next);
  };

  const premium = subscription?.status === 'active';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-surface-2 border border-border p-6 md:p-10">
      {/* Animated drifting orbs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-accent-primary/[0.08] rounded-full blur-[80px] animate-orb-drift pointer-events-none" />
      <div
        className="absolute bottom-0 left-0 w-48 h-48 bg-accent-success/[0.05] rounded-full blur-[60px] animate-orb-drift pointer-events-none"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-40 h-40 bg-fuchsia-500/[0.05] rounded-full blur-[70px] animate-orb-drift pointer-events-none"
        style={{ animationDelay: '-3s' }}
      />
      {/* subtle grid sheen */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgb(var(--fg)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--fg)) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        {/* Avatar with rotating conic glow ring */}
        <div className="relative group shrink-0">
          {/* rotating conic arc — primary */}
          <div
            className="absolute -inset-1.5 rounded-full opacity-70 animate-spin-slow pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, var(--accent-primary) 18%, transparent 38%, transparent 62%, #a78bfa 82%, transparent 100%)',
              filter: 'blur(6px)',
            }}
          />
          {/* counter-rotating faint ring */}
          <div
            className="absolute -inset-3 rounded-full opacity-30 animate-spin-reverse pointer-events-none"
            style={{
              background: 'conic-gradient(from 180deg, transparent 0%, #22d3ee 15%, transparent 40%)',
              filter: 'blur(8px)',
            }}
          />
          {/* soft halo */}
          <div className="absolute inset-0 rounded-full bg-accent-primary/25 blur-xl group-hover:bg-accent-primary/40 transition-all duration-500 animate-glow-pulse pointer-events-none" />

          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name}
            ring
            sizeClass="w-28 h-28 md:w-32 md:h-32"
            className="relative"
          />
          {/* One-tap avatar swap without opening the full edit modal. */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label={t('avatar_change')}
            className="absolute -bottom-1 -left-1 w-10 h-10 rounded-xl bg-surface-2 border border-border text-foreground flex items-center justify-center hover:bg-accent-primary hover:text-white hover:border-accent-primary transition-all shadow-md z-10"
          >
            <Camera size={16} />
          </button>
          {/* Level badge with pulse */}
          <div className="absolute -bottom-1 -right-1 z-10">
            <span className="absolute inset-0 rounded-xl bg-accent-primary/50 animate-pulse-ring pointer-events-none" />
            <div className="relative w-10 h-10 rounded-xl bg-accent-primary text-white flex items-center justify-center text-sm font-black shadow-glow-primary">
              {level}
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left min-w-0 w-full">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl md:text-4xl font-black tracking-tight mb-1 truncate"
          >
            {profile?.full_name || t('profile_default_name')}
          </motion.h1>
          {profile?.username && (
            <p className="text-muted-foreground text-sm mb-3">@{profile.username}</p>
          )}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-primary/10 text-accent-primary text-xs font-bold border border-accent-primary/20">
              <TrendingUp size={12} /> {t('profile_xp_level').replace('{level}', String(level)).replace('{xp}', String(xp))}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
              premium
                ? 'bg-gradient-to-r from-amber-400/15 to-yellow-300/10 text-amber-300 border-amber-400/30'
                : 'bg-surface-2 text-muted-foreground border-border'
            }`}>
              {premium
                ? (subscription.plan === 'lifetime' ? 'Lifetime' : subscription.plan)
                : t('profile_free_plan')}
            </span>
            {daysSinceJoin > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-2 text-muted-foreground text-xs font-bold border border-border">
                <Calendar size={12} /> {t('profile_days_in_hira').replace('{n}', String(daysSinceJoin))}
              </span>
            )}
          </div>

          {/* XP progress with animated fill + shine */}
          <div className="max-w-md mx-auto md:mx-0">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-medium">{t('profile_xp_to_next')}</span>
              <span className="font-bold text-accent-primary">{xpInLevel} / {xpNeeded} XP</span>
            </div>
            <div className="relative h-2.5 bg-surface-1 rounded-full overflow-hidden border border-border/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                className="relative h-full rounded-full bg-gradient-to-r from-accent-primary via-indigo-400 to-blue-400 overflow-hidden"
              >
                <div
                  className="absolute inset-y-0 w-1/3 bg-white/50 blur-[3px] animate-bar-shine"
                  style={{ transform: 'translateX(-100%)' }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AvatarPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCropped={handleAvatarCropped}
        title={profile?.full_name ?? profile?.username ?? undefined}
      />
    </div>
  );
};
