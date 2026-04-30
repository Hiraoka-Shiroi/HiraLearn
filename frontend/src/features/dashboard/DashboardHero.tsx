/**
 * Large, mascot-forward greeting block for the top of the dashboard.
 *
 * Visually it's the focal point of the page: left column holds a
 * time-aware greeting, current level, XP progress ring, and a
 * "Continue learning" CTA; right column holds the Hira mascot with a
 * soft glow.
 *
 * Keep this component focused on presentation — all learning data is
 * passed in as props.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Sparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';
import { useAuthStore } from '@/store/useAuthStore';
import { Mascot } from '@/components/illustrations/Mascot';
import { DecorBlob } from '@/components/illustrations/DecorBlob';
import { Avatar } from '@/components/avatar/Avatar';

interface DashboardHeroProps {
  level: number;
  xp: number;
  xpInLevel: number;
  xpNeeded: number;
  xpPercent: number;
  continueHref: string | null;
  continueTitle?: string | null;
}

const greetingKey = () => {
  const h = new Date().getHours();
  if (h < 6) return 'dash_greet_night';
  if (h < 12) return 'dash_greet_morning';
  if (h < 18) return 'dash_greet_day';
  return 'dash_greet_evening';
};

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  level, xp, xpInLevel, xpNeeded, xpPercent, continueHref, continueTitle,
}) => {
  const { profile } = useAuthStore();
  const { t } = useLanguage();
  const firstName = (profile?.full_name || '').trim().split(/\s+/)[0];
  const hint = firstName || profile?.username || t('profile_default_name');

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent-primary/10 via-card to-card p-5 md:p-8">
      <DecorBlob color="primary" className="top-[-20%] right-[-10%]" size={320} />
      <DecorBlob color="success" className="bottom-[-30%] left-[-10%]" size={240} />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:gap-8 items-center">
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-accent-primary mb-1.5 flex items-center gap-1.5">
            <Sparkles size={14} /> {t(greetingKey())}
          </p>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-3 leading-tight">
            {t('dash_hero_hi').replace('{name}', hint)}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-5 md:mb-6 max-w-md">
            {t('dash_hero_sub')}
          </p>

          {/* XP / Level progress */}
          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-3.5 md:p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Avatar src={profile?.avatar_url} name={profile?.full_name} sizeClass="w-10 h-10" />
                  <span className="absolute -bottom-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-md bg-accent-primary text-white flex items-center justify-center font-black text-[10px] shadow-glow-primary border-2 border-card">
                    {level}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('sidebar_level')}</p>
                  <p className="text-sm font-black leading-none">{xp} XP</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-accent-warning">
                <Trophy size={14} /> {xpInLevel}/{xpNeeded}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-1 border border-border/40 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-accent-primary via-indigo-400 to-fuchsia-400 rounded-full"
              />
            </div>
          </div>

          {continueHref ? (
            <Link
              to={continueHref}
              className="inline-flex items-center gap-2 bg-accent-primary text-white rounded-xl font-bold px-4 md:px-5 py-3 shadow-glow-primary active:scale-[0.97] md:hover:opacity-90 transition-all min-h-[48px]"
            >
              {t('dash_continue')}
              {continueTitle && (
                <span className="hidden sm:inline font-semibold text-white/80 max-w-[180px] truncate">
                  · {continueTitle}
                </span>
              )}
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 bg-accent-primary text-white rounded-xl font-bold px-4 md:px-5 py-3 shadow-glow-primary active:scale-[0.97] md:hover:opacity-90 transition-all min-h-[48px]"
            >
              {t('dash_start_journey')} <ArrowRight size={18} />
            </Link>
          )}
        </div>

        <div className="relative hidden sm:flex items-center justify-center shrink-0">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Mascot variant="wave" sizeClass="w-36 h-36 md:w-44 md:h-44" glow />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
