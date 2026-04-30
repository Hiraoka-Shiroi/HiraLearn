import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar } from 'lucide-react';
import { Avatar } from '@/components/avatar/Avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/i18n/useLanguage';
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
  const { profile } = useAuthStore();
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-surface-2 border border-border p-6 md:p-10">
      <div className="absolute top-0 right-0 w-72 h-72 bg-accent-primary/[0.06] rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-success/[0.04] rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="relative group">
          <div className="absolute inset-0 rounded-full bg-accent-primary/20 blur-xl group-hover:bg-accent-primary/30 transition-all duration-500" />
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name}
            ring
            sizeClass="w-28 h-28 md:w-32 md:h-32"
            className="relative"
          />
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-xl bg-accent-primary text-white flex items-center justify-center text-sm font-black shadow-glow-primary">
            {level}
          </div>
        </div>

        <div className="flex-1 text-center md:text-left min-w-0">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1 truncate">
            {profile?.full_name || t('profile_default_name')}
          </h1>
          {profile?.username && (
            <p className="text-muted-foreground text-sm mb-3">@{profile.username}</p>
          )}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-primary/10 text-accent-primary text-xs font-bold border border-accent-primary/20">
              <TrendingUp size={12} /> {t('profile_xp_level').replace('{level}', String(level)).replace('{xp}', String(xp))}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
              subscription?.status === 'active'
                ? 'bg-accent-success/10 text-accent-success border-accent-success/20'
                : 'bg-surface-2 text-muted-foreground border-border'
            }`}>
              {subscription?.status === 'active'
                ? (subscription.plan === 'lifetime' ? 'Lifetime' : subscription.plan)
                : t('profile_free_plan')}
            </span>
            {daysSinceJoin > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-2 text-muted-foreground text-xs font-bold border border-border">
                <Calendar size={12} /> {t('profile_days_in_hira').replace('{n}', String(daysSinceJoin))}
              </span>
            )}
          </div>

          <div className="max-w-md">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-medium">{t('profile_xp_to_next')}</span>
              <span className="font-bold text-accent-primary">{xpInLevel} / {xpNeeded} XP</span>
            </div>
            <div className="h-2.5 bg-surface-1 rounded-full overflow-hidden border border-border/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-accent-primary to-blue-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
