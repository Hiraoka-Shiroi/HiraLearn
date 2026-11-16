import React from 'react';
import { Sparkles, Flame, BookOpen, Trophy } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';
import { useCountUp } from '@/hooks/useCountUp';

interface ProfileStatsProps {
  level: number;
  streak: number;
  completedCount: number;
  xp: number;
}

const StatMini: React.FC<{ icon: React.ReactNode; value: string; label: string; color: string }> = ({ icon, value, label, color }) => (
  <div className="flex items-center gap-3 rounded-xl bg-surface-1/80 border border-border/50 p-3">
    <div className={`shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-lg font-black leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

export const ProfileStats: React.FC<ProfileStatsProps> = ({ level, streak, completedCount, xp }) => {
  const { t } = useLanguage();
  const lvl = useCountUp(level);
  const str = useCountUp(streak);
  const done = useCountUp(completedCount);
  const xpAnim = useCountUp(xp);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatMini icon={<Sparkles size={20} />} value={String(lvl)} label={t('sidebar_level')} color="text-accent-primary" />
      <StatMini icon={<Flame size={20} />} value={String(str)} label={t('dash_streak')} color="text-accent-warning" />
      <StatMini icon={<BookOpen size={20} />} value={String(done)} label={t('dash_lessons_done')} color="text-accent-success" />
      <StatMini icon={<Trophy size={20} />} value={`${xpAnim}`} label="XP" color="text-accent-primary" />
    </div>
  );
};
