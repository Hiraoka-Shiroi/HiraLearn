import React from 'react';
import { motion } from 'framer-motion';
import { Flame, BookOpen, Trophy } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';
import { useCountUp } from '@/hooks/useCountUp';

interface ProfileStatsProps {
  level: number;
  streak: number;
  completedCount: number;
  xp: number;
  /** 0..100 progress through the current level — drives the ring. */
  xpPercent: number;
  xpInLevel: number;
  xpNeeded: number;
}

/* ── Shared card shell ─────────────────────────────────────── */

const StatCard: React.FC<{
  index: number;
  accent: string;          // tailwind text color class, e.g. "text-accent-primary"
  glowClass: string;       // shadow glow class, e.g. "shadow-glow-primary"
  blobClass: string;       // bg color for the drifting blob, e.g. "bg-accent-primary/20"
  iconAnim: string;        // continuous icon animation class
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ index, accent, glowClass, blobClass, iconAnim, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 22, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -5 }}
    className="group relative overflow-hidden rounded-2xl glass border border-border/60 p-4 md:p-5 flex flex-col items-center text-center min-h-[148px] justify-center hover:border-accent-primary/30 transition-colors"
  >
    {/* drifting glow blob */}
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl ${blobClass} animate-orb-drift pointer-events-none`} />
    {/* hover sheen sweep */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

    <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 ${accent} bg-surface-2 border border-border/60 ${iconAnim} ${glowClass}`}>
      {icon}
    </div>
    {children}
  </motion.div>
);

const StatValue: React.FC<{ children: React.ReactNode; accent?: string }> = ({ children, accent }) => (
  <p className={`text-3xl md:text-4xl font-black leading-none tracking-tight ${accent ?? ''}`}>{children}</p>
);

const StatLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mt-1.5">{children}</p>
);

/* ── Level: animated SVG ring with count-up in the center ─── */

const LevelRing: React.FC<{ level: number; xpPercent: number }> = ({ level, xpPercent }) => {
  const lvl = useCountUp(level);
  const R = 26;
  const C = 2 * Math.PI * R;
  const clamped = Math.max(0, Math.min(100, xpPercent));

  return (
    <div className="relative w-[72px] h-[72px] mb-2">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={R} fill="none" stroke="rgb(var(--border))" strokeWidth="5" />
        <motion.circle
          cx="32" cy="32" r={R} fill="none"
          stroke="url(#levelGrad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - clamped / 100) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
        <defs>
          <linearGradient id="levelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black leading-none">{lvl}</span>
      </div>
      {/* pulsing halo */}
      <span className="absolute inset-0 rounded-full border border-accent-primary/40 animate-pulse-ring pointer-events-none" />
    </div>
  );
};

/* ── Streak: flickering flame + rising embers ─────────────── */

const StreakStat: React.FC<{ streak: number; label: string }> = ({ streak, label }) => {
  const str = useCountUp(streak);
  const active = streak > 0;
  return (
    <>
      {active && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent-warning"
              style={{
                left: `${(i - 1) * 10}px`,
                animation: `particle-rise 1.8s ease-out ${i * 0.5}s infinite`,
              }}
            />
          ))}
        </div>
      )}
      <StatValue accent={active ? 'text-accent-warning' : 'text-muted-foreground'}>{str}</StatValue>
      <StatLabel>{label}</StatLabel>
      <p className="text-[10px] text-muted-foreground/80 mt-0.5">{active ? 'дней подряд' : 'начни сегодня'}</p>
    </>
  );
};

/* ── Lessons: flipping book ───────────────────────────────── */

const LessonsStat: React.FC<{ count: number; label: string }> = ({ count, label }) => {
  const done = useCountUp(count);
  return (
    <>
      <StatValue accent="text-accent-success">{done}</StatValue>
      <StatLabel>{label}</StatLabel>
      <p className="text-[10px] text-muted-foreground/80 mt-0.5">завершено</p>
    </>
  );
};

/* ── XP: shimmering number + shine bar ────────────────────── */

const XpStat: React.FC<{ xp: number }> = ({ xp }) => {
  const xpAnim = useCountUp(xp);
  return (
    <>
      <StatValue>
        <span className="text-shimmer bg-gradient-to-r from-accent-primary via-fuchsia-400 to-accent-primary">
          {xpAnim.toLocaleString()}
        </span>
      </StatValue>
      <StatLabel>XP</StatLabel>
      <div className="relative w-full max-w-[88px] h-1 mt-2 rounded-full bg-surface-1 overflow-hidden border border-border/40">
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-accent-primary to-fuchsia-400" />
        <div
          className="absolute inset-y-0 w-1/2 bg-white/40 blur-[2px] animate-bar-shine"
          style={{ transform: 'translateX(-100%)' }}
        />
      </div>
    </>
  );
};

/* ── Public component ─────────────────────────────────────── */

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  level, streak, completedCount, xp, xpPercent, xpInLevel, xpNeeded,
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Level */}
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -5 }}
        className="group relative overflow-hidden rounded-2xl glass border border-border/60 p-4 md:p-5 flex flex-col items-center text-center min-h-[148px] justify-center hover:border-accent-primary/30 transition-colors"
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl bg-accent-primary/20 animate-orb-drift pointer-events-none" />
        <LevelRing level={level} xpPercent={xpPercent} />
        <StatLabel>{t('sidebar_level')}</StatLabel>
        <p className="text-[10px] text-muted-foreground/80 mt-0.5">{xpInLevel}/{xpNeeded} XP</p>
      </motion.div>

      {/* Streak */}
      <StatCard
        index={1}
        accent="text-accent-warning"
        glowClass="shadow-glow-warning"
        blobClass="bg-accent-warning/20"
        iconAnim="animate-flame"
        icon={<Flame size={20} fill={streak > 0 ? 'currentColor' : 'none'} />}
      >
        <StreakStat streak={streak} label={t('dash_streak')} />
      </StatCard>

      {/* Lessons */}
      <StatCard
        index={2}
        accent="text-accent-success"
        glowClass="shadow-glow-success"
        blobClass="bg-accent-success/20"
        iconAnim="animate-page-flip"
        icon={<BookOpen size={20} />}
      >
        <LessonsStat count={completedCount} label={t('dash_lessons_done')} />
      </StatCard>

      {/* XP */}
      <StatCard
        index={3}
        accent="text-fuchsia-400"
        glowClass="shadow-glow-primary"
        blobClass="bg-fuchsia-500/20"
        iconAnim="animate-trophy-bounce"
        icon={<Trophy size={20} />}
      >
        <XpStat xp={xp} />
      </StatCard>
    </div>
  );
};
