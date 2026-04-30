/**
 * "Популярные курсы" — a horizontally-scrolling row of other available
 * courses (excluding the active one). Each card shows a CourseBadge,
 * title, and a tiny "continue/start" hint so the user can hop between
 * paths without leaving the dashboard.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';
import { CourseBadge } from '@/components/illustrations/CourseBadge';
import type { Course } from '@/types/database';

interface PopularCoursesProps {
  courses: Course[];
  activeCourseId?: string | null;
}

export const PopularCourses: React.FC<PopularCoursesProps> = ({ courses, activeCourseId }) => {
  const { t } = useLanguage();
  const list = courses.filter(c => c.id !== activeCourseId).slice(0, 6);
  if (list.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
          <Flame size={18} className="text-orange-400" /> {t('dash_popular_courses')}
        </h2>
        <Link to="/courses" className="text-xs font-bold text-accent-primary hover:underline">
          {t('dash_see_all')} →
        </Link>
      </div>

      {/* Scroll-snap row — more touch-friendly than a wrap grid on 360px */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 snap-x snap-mandatory custom-scrollbar">
        {list.map((c) => (
          <Link
            key={c.id}
            to={`/dashboard?course=${c.slug}`}
            className="snap-start shrink-0 w-[240px] md:w-auto rounded-2xl border border-border bg-card p-4 hover:border-accent-primary/40 transition-colors group"
          >
            <div className="flex items-start gap-3 mb-3">
              <CourseBadge kind={c.title} sizeClass="w-10 h-10" />
              <div className="min-w-0 flex-1">
                <p className="font-black text-sm truncate">{c.title}</p>
                {c.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{c.description}</p>
                )}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-primary group-hover:translate-x-0.5 transition-transform">
              {t('dash_open_course')} <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
