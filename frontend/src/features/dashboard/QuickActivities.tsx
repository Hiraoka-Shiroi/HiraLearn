/**
 * Four compact coloured tiles under the dashboard hero: Courses,
 * Arcade, Profile, Progress. Purely navigational — no data fetching.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Gamepad2, User, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';

const tiles = [
  { to: '/courses', icon: BookOpen, labelKey: 'dash_quick_courses', color: 'from-indigo-500/20 to-indigo-500/5', iconClass: 'text-indigo-400' },
  { to: '/games', icon: Gamepad2, labelKey: 'dash_quick_arcade', color: 'from-fuchsia-500/20 to-fuchsia-500/5', iconClass: 'text-fuchsia-400' },
  { to: '/profile', icon: User, labelKey: 'dash_quick_profile', color: 'from-emerald-500/20 to-emerald-500/5', iconClass: 'text-emerald-400' },
  { to: '/courses', icon: TrendingUp, labelKey: 'dash_quick_progress', color: 'from-orange-500/20 to-orange-500/5', iconClass: 'text-orange-400' },
] as const;

export const QuickActivities: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link
            key={tile.labelKey}
            to={tile.to}
            className={`group rounded-2xl border border-border bg-gradient-to-br ${tile.color} p-3 md:p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform min-h-[88px]`}
          >
            <div className={`w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center ${tile.iconClass} group-hover:scale-110 transition-transform`}>
              <Icon size={18} />
            </div>
            <span className="text-sm font-bold leading-tight">{t(tile.labelKey)}</span>
          </Link>
        );
      })}
    </div>
  );
};
