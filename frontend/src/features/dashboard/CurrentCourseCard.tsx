/**
 * Full-width "currently studying" tile. Shows the active course with a
 * CourseBadge illustration, progress bar and a "continue" CTA.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';
import { CourseBadge } from '@/components/illustrations/CourseBadge';
import type { Course, Module } from '@/types/database';

interface CurrentCourseCardProps {
  course: Course | null;
  module: Module | null;
  completed: number;
  total: number;
  nextLessonId: string | null;
}

export const CurrentCourseCard: React.FC<CurrentCourseCardProps> = ({
  course, module, completed, total, nextLessonId,
}) => {
  const { t } = useLanguage();
  if (!course) return null;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Link
      to={nextLessonId ? `/lessons/${nextLessonId}` : `/dashboard?course=${course.slug}`}
      className="group block relative overflow-hidden rounded-2xl border border-border bg-card hover:border-accent-primary/40 transition-colors p-4 md:p-5"
    >
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-accent-primary/5 blur-[50px]" />

      <div className="relative z-10 flex items-start gap-4">
        <CourseBadge kind={course.title} sizeClass="w-14 h-14 md:w-16 md:h-16" />

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-0.5 flex items-center gap-1.5">
            <BookOpen size={11} /> {t('dash_current_course')}
          </p>
          <h3 className="font-black text-base md:text-lg truncate">{course.title}</h3>
          {module && (
            <p className="text-xs text-muted-foreground truncate">{module.title}</p>
          )}

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-surface-1 border border-border/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-accent-primary to-indigo-400"
              />
            </div>
            <span className="text-xs font-black text-accent-primary shrink-0">{pct}%</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {completed}/{total} {t('dashboard_lessons')}
          </p>
        </div>

        <ArrowRight size={18} className="text-accent-primary opacity-60 group-hover:opacity-100 shrink-0 mt-2 transition-opacity" />
      </div>
    </Link>
  );
};
