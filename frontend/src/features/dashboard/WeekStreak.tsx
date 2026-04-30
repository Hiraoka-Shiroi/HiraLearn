/**
 * A simple 7-day streak strip. We don't have per-day activity records,
 * so we approximate the "active" days as the last `streak` days ending
 * today. This is enough for a motivational UX beat without hitting the
 * API. Swap to a real per-day source later without touching callers.
 */

import React from 'react';
import { Flame } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';

interface WeekStreakProps {
  streak: number;
}

const WEEK_DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEK_DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeekStreak: React.FC<WeekStreakProps> = ({ streak }) => {
  const { t, language } = useLanguage();
  const days = language === 'ru' ? WEEK_DAYS_RU : WEEK_DAYS_EN;

  // JS: Sunday=0 ... Saturday=6. Convert to Mon-first.
  const today = new Date();
  const jsDay = today.getDay();
  const monFirstToday = (jsDay + 6) % 7; // 0..6 with Monday=0
  // Mark the last `min(streak, 7)` days up to (and including) today as active.
  const active = new Array(7).fill(false);
  const activeCount = Math.min(streak, 7);
  for (let i = 0; i < activeCount; i++) {
    const idx = (monFirstToday - i + 7) % 7;
    active[idx] = true;
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
            <Flame size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('dash_streak_title')}</p>
            <p className="font-black text-lg leading-none mt-0.5">
              {streak} <span className="text-sm font-bold text-muted-foreground">{t('dash_streak_days')}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1">
        {days.map((d, i) => (
          <div key={d} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div
              className={`w-full aspect-square max-w-[32px] rounded-lg flex items-center justify-center text-[10px] font-black transition-colors ${
                active[i]
                  ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-glow-warning'
                  : i === monFirstToday
                    ? 'bg-surface-1 border border-dashed border-accent-primary/40 text-accent-primary'
                    : 'bg-surface-1 border border-border text-muted-foreground/50'
              }`}
            >
              {active[i] ? <Flame size={12} /> : ''}
            </div>
            <span className={`text-[10px] font-bold ${i === monFirstToday ? 'text-accent-primary' : 'text-muted-foreground'}`}>
              {d[0]}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        {streak > 0 ? t('dash_streak_motivate') : t('dash_streak_cta')}
      </p>
    </div>
  );
};
