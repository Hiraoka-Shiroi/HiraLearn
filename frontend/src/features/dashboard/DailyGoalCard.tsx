/**
 * "Ежедневная цель" tile. We don't have a per-day completed-lessons
 * feed yet, so the card reads the user's configured daily goal
 * (in minutes) and visualises "progress towards it" based on whether
 * the streak was incremented today. This is a motivational approximation
 * meant to look great, not a scientific measurement.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';

interface DailyGoalCardProps {
  dailyMinutes: number;
  hasStreakToday: boolean;
  lessonsDoneToday: number;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  dailyMinutes, hasStreakToday, lessonsDoneToday,
}) => {
  const { t } = useLanguage();
  // Heuristic: the goal is met if the streak ticked today OR at least
  // one lesson was completed in the last 24h. Until we have real minute
  // tracking, show 100% vs a light-hearted partial state.
  const met = hasStreakToday || lessonsDoneToday > 0;
  const pct = met ? 100 : Math.min(80, lessonsDoneToday * 60);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/20 p-4 md:p-5 relative overflow-hidden">
      <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full bg-emerald-500/15 blur-[40px]" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Target size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('dash_daily_goal')}</p>
            <p className="font-black text-lg leading-none mt-0.5">
              {dailyMinutes} <span className="text-sm font-bold text-muted-foreground">{t('profile_minutes_short')}/день</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" stroke="rgb(16 185 129 / 0.15)" strokeWidth="6" fill="none" />
              <motion.circle
                cx="28" cy="28" r="22"
                stroke="#10b981"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                initial={{ strokeDasharray: '0 200' }}
                animate={{ strokeDasharray: `${(pct / 100) * 138.23} 200` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-black text-sm">
              {met ? <CheckCircle2 size={18} className="text-emerald-400" /> : `${pct}%`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">
            {met ? t('dash_daily_goal_met') : t('dash_daily_goal_hint')}
          </p>
        </div>
      </div>
    </div>
  );
};
